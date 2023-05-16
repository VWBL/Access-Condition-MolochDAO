import { expect } from 'chai';
import hre, { network } from 'hardhat';

import { AccessControlCheckerByDAOMember } from '../typechain/AccessControlCheckerByDAOMember';
import { AccessControlCheckerByDAOMember__factory } from '../typechain/factories/AccessControlCheckerByDAOMember__factory';
import { VWBLGateway } from '../typechain/VWBLGateway';
import { VWBLGateway__factory } from '../typechain/factories/VWBLGateway__factory'
import { GatewayProxy } from '../typechain/GatewayProxy';
import { GatewayProxy__factory } from '../typechain/factories/GatewayProxy__factory';
import { parseEther } from '@ethersproject/units';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('AccessConntrolCheckerByDAOMember', function () {
    const DOCUMENT_ID1 = "0xac00000000000000000000000000000000000000000000000000000000000000";
    const DOCUMENT_ID2 = "0xbc00000000000000000000000000000000000000000000000000000000000000";
    const creator = "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6";
    let creatorSigner: SignerWithAddress;
    const DAOMember = "0xd26a3f686d43f2a62ba9eae2ff77e9f516d945b9"
    let DAOMemberSigner: SignerWithAddress;
    const nonDAOMember = "0xe5F8086DAc91E039b1400febF0aB33ba3487F29A";
    let nonDAOMemberSigner: SignerWithAddress;
    let accessConditionContract: AccessControlCheckerByDAOMember;
    let vwblGatewayContract: VWBLGateway;
    let gatewayProxyContract: GatewayProxy;

    it ('deploy contract', async function () {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
        });
        const deployerOrSigner = await hre.ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const vwblGatewayContractFactory = (await hre.ethers.getContractFactory(
            'VWBLGateway'
        )) as VWBLGateway__factory
        vwblGatewayContract = await vwblGatewayContractFactory
            .connect(deployerOrSigner)
            .deploy(
                parseEther("0.001")
            );
        await vwblGatewayContract.deployed();

        const gatewayProxyContractFactory = (await hre.ethers.getContractFactory(
            'GatewayProxy'
        )) as GatewayProxy__factory;
        gatewayProxyContract = await gatewayProxyContractFactory
            .connect(deployerOrSigner)
            .deploy(
                vwblGatewayContract.address
            );

        const accessConditionContractFactory = (await hre.ethers.getContractFactory(
            'AccessControlCheckerByDAOMember' 
        )) as AccessControlCheckerByDAOMember__factory;
        accessConditionContract = await accessConditionContractFactory
            .connect(deployerOrSigner)
            .deploy(
                "0x519F9662798c2E07fbd5B30C1445602320C5cF5B", // MolochDAO: Moloch Treasury V3
                gatewayProxyContract.address,
                "Hello DAO Member",
                "https.xxx.yyy.zzz"
            );
        await accessConditionContract.deployed();

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [creator]
        });
        creatorSigner = await hre.ethers.getSigner(creator);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [DAOMember]
        });
        DAOMemberSigner = await hre.ethers.getSigner(DAOMember);

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [nonDAOMember]
        });
        nonDAOMemberSigner = await hre.ethers.getSigner(nonDAOMember);
    })

    it ("should grant access control to dao member from creator", async () => {
        await accessConditionContract.connect(creatorSigner).grantAccessControlToDAOMember(
            DOCUMENT_ID1,
            "dao's document name", // name
            "https://xxx.yyy.zzz", // encryptedDataUrl
            {
                value: parseEther("0.001")
            }
        );
        
        const documentInfo = await accessConditionContract.documentIdToInfo(DOCUMENT_ID1);
        expect(documentInfo.author.toLocaleLowerCase()).eq(creator);
        expect(documentInfo.name).eq("dao's document name");
        expect(documentInfo.encryptedDataUrl).eq("https://xxx.yyy.zzz");
    })

    it ("should not grant access control from non dao member", async () => {
        await expect(accessConditionContract.connect(nonDAOMemberSigner).grantAccessControlToDAOMember(
            DOCUMENT_ID2,
            "document name",
            "https://aaa.bbb.ccc",
            {
                value: parseEther("0.001")
            }
        )).to.be.revertedWith('msg.sender is not a DAO member');
    })


    it ("should hasAccessControl return true if content creator", async () => {
        const isPermitted = await vwblGatewayContract.hasAccessControl(
            creator,
            DOCUMENT_ID1
        );
        expect(isPermitted).true;
    })

    it ("should hasAccessControl return false if dao member doesn't pay fee", async () => {
        const isPermitted = await vwblGatewayContract.hasAccessControl(
            DAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted).false;
    })

    it("should hasAccessControl return true if user is moloch dao member and user pay fee", async () => {
        await vwblGatewayContract.connect(DAOMemberSigner).payFee(
            DOCUMENT_ID1, 
            DAOMember,
            {
                value: parseEther("0.001")
            }    
        )
        const isPermitted = await vwblGatewayContract.hasAccessControl(
            DAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted).true;
    });

    it("should hasAccessControl return false if user is not moloch dao member", async () => {
        const isPermitted1 = await vwblGatewayContract.hasAccessControl(
            nonDAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted1).false;

        // Even if non dao member pay fee, hasAccessControl return false
        await vwblGatewayContract.connect(nonDAOMemberSigner).payFee(
            DOCUMENT_ID1,
            nonDAOMember,
            {
                value: parseEther("0.001")
            }
        )

        const isPermitted2 = await vwblGatewayContract.hasAccessControl(
            nonDAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted2).false;
    })
})