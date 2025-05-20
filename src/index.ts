import { Client, Payment, xrpToDrops } from "xrpl";

async function main() {
    const client = new Client("wss://s.altnet.rippletest.net:51233/");

    await client.connect();
    
    const {wallet, balance} = await client.fundWallet();
    console.log(`Wallet address: ${wallet.classicAddress} - Balance: ${balance}`);

    const paymentTx: Payment = {
        TransactionType: "Payment",
        Account: wallet.classicAddress,
        Destination: "r91KtCG8sNTZDf4ncYcRTzXjt6qWYVgh3p",
        Amount: xrpToDrops(10)
    }

    const tx = await client.submitAndWait(paymentTx, { autofill: true, wallet });

    if(tx.result.validated) {
        console.log(`Transaction successful! Transaction hash: ${tx.result.hash}`);
    } else {
        console.log(`Transaction failed! Error: ${tx.result.meta}`);
    }

    await client.disconnect();
}

main();