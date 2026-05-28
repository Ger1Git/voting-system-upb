#!/bin/sh
set -eu

npm run node &
NODE_PID=$!

echo "Waiting for Hardhat RPC on 8545..."
until node -e "const net=require('net');const s=net.connect(8545,'127.0.0.1',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1));"; do
  sleep 1
done

echo "Hardhat RPC is ready. Deploying contracts..."
npm run deploy:local

echo "Contracts deployed. Keeping Hardhat node running."
wait "$NODE_PID"
