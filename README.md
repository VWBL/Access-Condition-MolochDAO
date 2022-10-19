# Access-Condition-MolchDAO
VWBL's access condition contract which defined MolchDAO member only can view digital content

## Install and Compile
1. Install npm packages
```
yarn install
```
2. Compile smart contract
```
yarn compile
```

## Run uni tests
1. Start a local Ethereum network based on a snapshot of the mainnet.
```
npx hardhat node --fork mainet-eth-rpc --fork-block-number block-number
```

2. In a separate terminal, run the test command with the `localhost` network.
```
npx hardhat test --network localhost
```


