// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingElection
 * @notice Commit-reveal university voting.
 *         Organizer manages the lifecycle; oracle relays student submissions.
 *         Neither role can read or forge vote content.
 */
contract VotingElection {
    enum ElectionState { Created, VotingOpen, VotingClosed, ResultsPublished }

    struct Candidate {
        uint256 id;
        string name;
    }

    struct Election {
        uint256 id;
        string title;
        ElectionState state;
        uint64 startTime;
        uint64 endTime;
        uint256 candidateCount;
        uint256 votesCommitted;
        uint256 votesRevealed;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public organizer;
    address public oracle;
    uint256 public electionCount;

    mapping(uint256 => Election)                              public elections;
    mapping(uint256 => mapping(uint256 => Candidate))         public candidates;
    mapping(uint256 => mapping(bytes32 => bool))              public hasVoted;
    mapping(uint256 => mapping(bytes32 => bool))              public hasRevealed;
    mapping(uint256 => mapping(bytes32 => bytes32))           public voteCommitment;
    mapping(uint256 => mapping(uint256 => uint256))           public voteCounts;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ElectionCreated(uint256 indexed electionId, string title, uint64 startTime, uint64 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VotingOpened(uint256 indexed electionId);
    event VotingClosed(uint256 indexed electionId);
    event VoteCommitted(uint256 indexed electionId, bytes32 indexed voterHash, bytes32 commitment, uint256 timestamp);
    event VoteRevealed(uint256 indexed electionId, bytes32 indexed voterHash, uint256 candidateId);
    event ResultsPublished(uint256 indexed electionId);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotOrganizer();
    error NotOracle();
    error InvalidElection();
    error InvalidCandidate();
    error InvalidState();
    error VotingNotOpen();
    error AlreadyVoted();
    error AlreadyRevealed();
    error ResultsNotAvailable();
    error InvalidCommitment();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOrganizer() { if (msg.sender != organizer) revert NotOrganizer(); _; }
    modifier onlyOracle()    { if (msg.sender != oracle)    revert NotOracle();    _; }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        organizer = msg.sender;
        oracle    = msg.sender;
    }

    function setOracle(address newOracle) external onlyOrganizer {
        oracle = newOracle;
    }

    // ─── Organizer: lifecycle ─────────────────────────────────────────────────

    function createElection(string calldata title, uint64 startTime, uint64 endTime)
        external onlyOrganizer returns (uint256 electionId)
    {
        electionId = ++electionCount;
        elections[electionId] = Election({
            id: electionId,
            title: title,
            state: ElectionState.Created,
            startTime: startTime,
            endTime: endTime,
            candidateCount: 0,
            votesCommitted: 0,
            votesRevealed: 0
        });
        emit ElectionCreated(electionId, title, startTime, endTime);
    }

    function addCandidate(uint256 electionId, string calldata name) external onlyOrganizer {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.Created) revert InvalidState();
        uint256 cid = ++e.candidateCount;
        candidates[electionId][cid] = Candidate({ id: cid, name: name });
        emit CandidateAdded(electionId, cid, name);
    }

    function openVoting(uint256 electionId) external onlyOrganizer {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.Created) revert InvalidState();
        e.state = ElectionState.VotingOpen;
        emit VotingOpened(electionId);
    }

    function closeVoting(uint256 electionId) external onlyOrganizer {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.VotingOpen) revert InvalidState();
        e.state = ElectionState.VotingClosed;
        emit VotingClosed(electionId);
    }

    function publishResults(uint256 electionId) external onlyOrganizer {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.VotingClosed) revert InvalidState();
        e.state = ElectionState.ResultsPublished;
        emit ResultsPublished(electionId);
    }

    // ─── Oracle: commit & reveal ──────────────────────────────────────────────

    /// @notice Stores an opaque commitment; the actual choice is unknown on-chain.
    function castVote(uint256 electionId, bytes32 voterHash, bytes32 commitment) external onlyOracle {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.VotingOpen) revert VotingNotOpen();
        if (commitment == bytes32(0))             revert InvalidCommitment();
        if (hasVoted[electionId][voterHash])      revert AlreadyVoted();

        hasVoted[electionId][voterHash]      = true;
        voteCommitment[electionId][voterHash] = commitment;
        e.votesCommitted += 1;

        emit VoteCommitted(electionId, voterHash, commitment, block.timestamp);
    }

    /// @notice Tally increments only when the revealed secret matches the stored commitment.
    function revealVote(uint256 electionId, bytes32 voterHash, uint256 candidateId, bytes32 nonce)
        external onlyOracle
    {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.VotingClosed)              revert InvalidState();
        if (!hasVoted[electionId][voterHash])                   revert InvalidCommitment();
        if (hasRevealed[electionId][voterHash])                 revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > e.candidateCount) revert InvalidCandidate();

        bytes32 expected = keccak256(abi.encodePacked(voterHash, candidateId, nonce, electionId));
        if (voteCommitment[electionId][voterHash] != expected)  revert InvalidCommitment();

        hasRevealed[electionId][voterHash]  = true;
        voteCounts[electionId][candidateId] += 1;
        e.votesRevealed += 1;

        emit VoteRevealed(electionId, voterHash, candidateId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Results are gated behind ResultsPublished to hide tallies during the reveal window.
    function getResults(uint256 electionId)
        external view
        returns (uint256[] memory ids, uint256[] memory counts, string[] memory names)
    {
        Election storage e = _get(electionId);
        if (e.state != ElectionState.ResultsPublished) revert ResultsNotAvailable();

        uint256 n = e.candidateCount;
        ids    = new uint256[](n);
        counts = new uint256[](n);
        names  = new string[](n);

        for (uint256 i = 1; i <= n; i++) {
            ids[i-1]    = i;
            counts[i-1] = voteCounts[electionId][i];
            names[i-1]  = candidates[electionId][i].name;
        }
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _get(uint256 electionId) private view returns (Election storage e) {
        e = elections[electionId];
        if (e.id == 0) revert InvalidElection();
    }
}
