import chalk from "chalk";
import { AccountSet, AccountSetAsfFlags, Client, convertStringToHex, multisign, Payment, SignerListSet, TicketCreate, TrustSet, TrustSetFlags, xrpToDrops } from "xrpl";

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

// async function multisig() {
//     console.log(chalk.bgWhite("-- MULTISIG --"));
//     const client = new Client("wss://s.altnet.rippletest.net:51233/");

//     await client.connect();

//     const { wallet: multisig } = await client.fundWallet();
//     console.log(`Multisig wallet address: ${multisig.classicAddress}`);
//     const { wallet: wallet1 } = await client.fundWallet();
//     console.log(`Wallet 1 address: ${wallet1.classicAddress}`);
//     const { wallet: wallet2 } = await client.fundWallet();
//     console.log(`Wallet 2 address: ${wallet2.classicAddress}`);

//     const signerListTx: SignerListSet = {
//         TransactionType: "SignerListSet",
//         Account: multisig.classicAddress,
//         SignerQuorum: 2,
//         SignerEntries: [
//             { SignerEntry: { Account: wallet1.classicAddress, SignerWeight: 1},},
//             { SignerEntry: { Account: wallet2.classicAddress, SignerWeight: 1}, }
//         ],
//     }

//     const tx = await client.submitAndWait(signerListTx, { autofill: true, wallet: multisig });

//     if( tx.result.validated) {
//         console.log(`✅ SignerListSet successful! Transaction hash: ${tx.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${tx.result.meta}`);
//     }

//     // Create ticket
//     console.log(chalk.bgWhite("-- CREATE TICKET --"));

//     const ticketTx: TicketCreate = {
//         TransactionType: "TicketCreate",
//         Account: multisig.classicAddress,
//         TicketCount: 5
//     }
//     const ticket = await client.submitAndWait(ticketTx, { autofill: true, wallet: multisig });
//     if( ticket.result.validated) {
//         console.log(`✅ TicketCreate successful! Transaction hash: ${ticket.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${ticket.result.meta}`);
//     }

//     // Get ticket
//     console.log(chalk.bgWhite("-- RETRIEVE TICKETS --"));

//     const accountTickets = await client.request({
//         command: 'account_objects' as const,
//         account: multisig.classicAddress,
//         type: 'ticket' as const,
//     });

//     console.log(`Active tickets: ${JSON.stringify(accountTickets.result.account_objects, null, 2)}\n`);

//     // Multisig payment
//     console.log(chalk.bgWhite("-- MULTISIG PAYMENT --"));
//     const paymentTx: Payment = await client.autofill({
//         TransactionType: "Payment",
//         Account: multisig.classicAddress,
//         Destination: wallet1.classicAddress,
//         Amount: xrpToDrops(10)
//     }, 2);

//     const wallet1Signature = wallet1.sign(paymentTx, true);
//     const wallet2Signature = wallet2.sign(paymentTx, true);

//     const multisigSignature = multisign([wallet1Signature.tx_blob, wallet2Signature.tx_blob]);
//     const result = await client.submitAndWait(multisigSignature);


//     if( result.result.validated) {
//         console.log(`✅ Multisig payment successful! Transaction hash: ${result.result.hash}`);
//     } else {
//         console.log(`❌ Transaction failed! Error: ${result.result.meta}`);
//     }

//     await client.disconnect();
// }

async function amm() {
    console.log(chalk.bgWhite("-- ACCOUNT SET RIPPLING  --"));
    const client = new Client("wss://s.altnet.rippletest.net:51233/");

    await client.connect();

    const { wallet: issuer } = await client.fundWallet();
    console.log(`Issuer: ${issuer.classicAddress}`);

    const { wallet: receiver } = await client.fundWallet();
    console.log(`Receiver: ${receiver.classicAddress}`);

    // ALLOW RIPPLING FOR ISSUER
    const accountSetTx: AccountSet = {
        TransactionType: "AccountSet",
        Account: issuer.classicAddress,
        SetFlag: AccountSetAsfFlags.asfDefaultRipple,
    }

    const result = await client.submitAndWait(accountSetTx, { autofill: true, wallet: issuer });

    if (result.result.validated)
        console.log(`✅ AccountSet successful! Transaction hash: ${result.result.hash}`);
    else
        console.log(`❌ AccountSet failed! Error: ${result.result.meta}`);

    // SET TRUSTLINE
    function convertStringToHexPadded(str: string): string {
        // Convert string to hexadecimal
        let hex: string = "";
        for (let i = 0; i < str.length; i++) {
            const hexChar: string = str.charCodeAt(i).toString(16);
            hex += hexChar;
        }

        // Pad with zeros to ensure it's 40 characters long
        const paddedHex: string = hex.padEnd(40, "0");
        return paddedHex.toUpperCase(); // Typically, hex is handled in uppercase
    }

    console.log(chalk.bgWhite("-- CREATE TRUSTLINE --"));

    const tokenCode = convertStringToHexPadded("USDM")

    const trustSetTx: TrustSet = {
        TransactionType: "TrustSet",
        Account: receiver.address,
        LimitAmount: {
            currency: tokenCode,
            issuer: issuer.address,
            value: "500000000",
        },
        Flags: TrustSetFlags.tfClearNoRipple
    }

    const trustSetTxResult = await client.submitAndWait(trustSetTx, { autofill: true, wallet: receiver });

    if (trustSetTxResult.result.validated)
        console.log(`✅ TrustSet successful! Transaction hash: ${trustSetTxResult.result.hash}`);
    else
        console.log(`❌ TrustSet failed! Error: ${trustSetTxResult.result.meta}`);

    // Send the token
    console.log(chalk.bgWhite("-- SEND PAYMENT --"));
    const sendPayment: Payment = {
        TransactionType: "Payment",
        Account: issuer.address,
        Destination: receiver.address,
        Amount: {
            currency: tokenCode,
            issuer: issuer.classicAddress,
            value: "10000",
        }
    };

    const preparedPaymentTx = await client.autofill(sendPayment);
    const resultPaymentTx = await client.submitAndWait(preparedPaymentTx, {
        wallet: issuer,
    });

    if (resultPaymentTx.result.validated)
        console.log(`✅➡️ Payment sent from ${issuer.address} to ${receiver.address}. Tx: ${resultPaymentTx.result.hash}`);
    else
        console.log(`❌ Payment failed! Error: ${resultPaymentTx.result.meta}`);
        
    await client.disconnect();
}

amm();