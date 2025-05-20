import chalk from "chalk";
import { Client, convertStringToHex, multisign, Payment, SignerListSet, xrpToDrops } from "xrpl";

// async function payment() {
//     console.log(chalk.bgWhite("-- PAYMENT + MEMO --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet, balance } = await client.fundWallet();
//     console.log(`Wallet address: ${wallet.classicAddress} - Balance: ${balance}`);

//     const paymentTx: Payment = {
//         TransactionType: "Payment",
//         Account: wallet.classicAddress,
//         Destination: "r91KtCG8sNTZDf4ncYcRTzXjt6qWYVgh3p",
//         Amount: xrpToDrops(1),
//         Memos: [
//             {
//                 Memo: {
//                     MemoData: convertStringToHex("https://www.xrpl-commons.org/community-magazine/defi-expectations"),
//                 }
//             }
//         ],
//     }

//     const tx = await client.submitAndWait(paymentTx, { autofill: true, wallet });

//     if (tx.result.validated) {
//         console.log(`✅ Transaction successful! Transaction hash: ${tx.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${tx.result.meta}`);
//     }

//     await client.disconnect();
// }

async function multisig() {
    console.log(chalk.bgWhite("-- MULTISIG --"));
    const client = new Client("wss://s.altnet.rippletest.net:51233/");

    await client.connect();

    const { wallet: multisig } = await client.fundWallet();
    console.log(`Multisig wallet address: ${multisig.classicAddress}`);
    const { wallet: wallet1 } = await client.fundWallet();
    console.log(`Wallet 1 address: ${wallet1.classicAddress}`);
    const { wallet: wallet2 } = await client.fundWallet();
    console.log(`Wallet 2 address: ${wallet2.classicAddress}`);

    const signerListTx: SignerListSet = {
        TransactionType: "SignerListSet",
        Account: multisig.classicAddress,
        SignerQuorum: 2,
        SignerEntries: [
            { SignerEntry: { Account: wallet1.classicAddress, SignerWeight: 1},},
            { SignerEntry: { Account: wallet2.classicAddress, SignerWeight: 1}, }
        ],
    }

    const tx = await client.submitAndWait(signerListTx, { autofill: true, wallet: multisig });

    if( tx.result.validated) {
        console.log(`✅ SignerListSet successful! Transaction hash: ${tx.result.hash}`);
    } else {
        console.log(`❌ Transaction failed! Error: ${tx.result.meta}`);
    }

    const paymentTx: Payment = await client.autofill({
        TransactionType: "Payment",
        Account: multisig.classicAddress,
        Destination: wallet1.classicAddress,
        Amount: xrpToDrops(10),
    }, 2);
    
    const wallet1Signature = wallet1.sign(paymentTx, true);
    const wallet2Signature = wallet2.sign(paymentTx, true);

    const multisigSignature = multisign([wallet1Signature.tx_blob, wallet2Signature.tx_blob]);
    const result = await client.submitAndWait(multisigSignature);


    if( result.result.validated) {
        console.log(`✅ Multisig payment successful! Transaction hash: ${result.result.hash}`);
    } else {
        console.log(`❌ Transaction failed! Error: ${result.result.meta}`);
    }

    await client.disconnect();
}

multisig();