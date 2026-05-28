// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingElection
 * @notice Trust-minimized university voting:
 *         - Organizer: create election pool, open/close voting, publish results flag only.
 *         - Oracle: relays commitments and per-voter reveals (cannot forge commitments).
 *         - Tallies grow only when each voter's reveal matches their on-chain commitment.
 *         - Organizer NEVER receives ballot secrets and cannot call bulk tally.
 */
contract VotingElection {
    enum ElectionState {
        Created,
        VotingOpen,
        VotingClosed,
        ResultsPublished
    }

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

    /// @notice Creates and schedules elections only — no access to vote content.
    address public organizer;
    /// @notice Relays student submissions; cannot change commitments or counts directly.
    address public oracle;
    uint256 public electionCount;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    mapping(uint256 => mapping(bytes32 => bool)) public hasVoted;
    mapping(uint256 => mapping(bytes32 => bool)) public hasRevealed;
    mapping(uint256 => mapping(bytes32 => bytes32)) public voteCommitment;
    mapping(uint256 => mapping(uint256 => uint256)) public voteCounts;

    event ElectionCreated(uint256 indexed electionId, string title, uint64 startTime, uint64 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VotingOpened(uint256 indexed electionId);
    event VotingClosed(uint256 indexed electionId);
    event VoteCommitted(
        uint256 indexed electionId,
        bytes32 indexed voterHash,
        bytes32 commitment,
        uint256 timestamp
    );
    event VoteRevealed(uint256 indexed electionId, bytes32 indexed voterHash, uint256 candidateId);
    event ResultsPublished(uint256 indexed electionId);

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

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert NotOrganizer();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor() {
        organizer = msg.sender;
        oracle = msg.sender;
    }

    function setOracle(address newOracle) external onlyOrganizer {
        oracle = newOracle;
    }

    function createElection(
        string calldata title,
        uint64 startTime,
        uint64 endTime
    ) external onlyOrganizer returns (uint256 electionId) {
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
        Election storage e = elections[electionId];
        if (e.id == 0) revert InvalidElection();
        if (e.state != ElectionState.Created) revert InvalidState();

        uint256 candidateId = ++e.candidateCount;
        candidates[electionId][candidateId] = Candidate({id: candidateId, name: name});
        emit CandidateAdded(electionId, candidateId, name);
    }

    function openVoting(uint256 electionId) external onlyOrganizer {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.Created) revert InvalidState();
        e.state = ElectionState.VotingOpen;
        emit VotingOpened(electionId);
    }

    function closeVoting(uint256 electionId) external onlyOrganizer {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.VotingOpen) revert InvalidState();
        e.state = ElectionState.VotingClosed;
        emit VotingClosed(electionId);
    }

    /**
     * @notice Store commitment only. Choice is unknown on ledger until voter reveals.
     */
    function castVote(
        uint256 electionId,
        bytes32 voterHash,
        bytes32 commitment
    ) external onlyOracle {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.VotingOpen) revert VotingNotOpen();
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (hasVoted[electionId][voterHash]) revert AlreadyVoted();

        hasVoted[electionId][voterHash] = true;
        voteCommitment[electionId][voterHash] = commitment;
        e.votesCommitted += 1;

        emit VoteCommitted(electionId, voterHash, commitment, block.timestamp);
    }

    /**
     * @notice Each voter reveals their own ballot after close. Counts update on-chain; organizer cannot inject votes.
     */
    function revealVote(
        uint256 electionId,
        bytes32 voterHash,
        uint256 candidateId,
        bytes32 nonce
    ) external onlyOracle {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.VotingClosed) revert InvalidState();
        if (!hasVoted[electionId][voterHash]) revert InvalidCommitment();
        if (hasRevealed[electionId][voterHash]) revert AlreadyRevealed();
        if (candidateId == 0 || candidateId > e.candidateCount) revert InvalidCandidate();

        bytes32 expected = _computeCommitment(voterHash, candidateId, nonce, electionId);
        if (voteCommitment[electionId][voterHash] != expected) revert InvalidCommitment();

        hasRevealed[electionId][voterHash] = true;
        voteCounts[electionId][candidateId] += 1;
        e.votesRevealed += 1;

        emit VoteRevealed(electionId, voterHash, candidateId);
    }

    /**
     * @notice Organizer only makes results publicly readable — cannot set vote numbers.
     */
    function publishResults(uint256 electionId) external onlyOrganizer {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.VotingClosed) revert InvalidState();
        e.state = ElectionState.ResultsPublished;
        emit ResultsPublished(electionId);
    }

    function getHasVoted(uint256 electionId, bytes32 voterHash) external view returns (bool) {
        return hasVoted[electionId][voterHash];
    }

    function getHasRevealed(uint256 electionId, bytes32 voterHash) external view returns (bool) {
        return hasRevealed[electionId][voterHash];
    }

    function getVoteCommitment(uint256 electionId, bytes32 voterHash) external view returns (bytes32) {
        return voteCommitment[electionId][voterHash];
    }

    function getParticipationStats(uint256 electionId)
        external
        view
        returns (uint256 committed, uint256 revealed)
    {
        Election storage e = _election(electionId);
        return (e.votesCommitted, e.votesRevealed);
    }

    /**
     * @notice Totals visible only after publishResults (hidden during voting and reveal window).
     */
    function getResults(
        uint256 electionId
    )
        external
        view
        returns (uint256[] memory candidateIds, uint256[] memory counts, string[] memory names)
    {
        Election storage e = _election(electionId);
        if (e.state != ElectionState.ResultsPublished) revert ResultsNotAvailable();

        uint256 n = e.candidateCount;
        candidateIds = new uint256[](n);
        counts = new uint256[](n);
        names = new string[](n);

        for (uint256 i = 1; i <= n; i++) {
            candidateIds[i - 1] = i;
            counts[i - 1] = voteCounts[electionId][i];
            names[i - 1] = candidates[electionId][i].name;
        }
    }

    function _computeCommitment(
        bytes32 voterHash,
        uint256 candidateId,
        bytes32 nonce,
        uint256 electionId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(voterHash, candidateId, nonce, electionId));
    }

    function _election(uint256 electionId) private view returns (Election storage e) {
        e = elections[electionId];
        if (e.id == 0) revert InvalidElection();
    }
}
