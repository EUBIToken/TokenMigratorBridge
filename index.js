"use strict";

//Print publisher info
console.log('EUBITokenBridge v1.1 - the bridge between EUBI and bEUBI');
console.log('Made by Jessie Lesbian');
console.log('Email: jessielesbian@protonmail.com Reddit: https://www.reddit.com/u/jessielesbian');
console.log('');

//Protect against potentially insecure libraries by putting everything in this scope
{
	/* We define our methods before we continue the initialization process */

	//The final send have barely enough permissions!
	const finalSend = async function(MintX2Signed, BSCTXSigned, MintME, BSC, res, end2){
		MintME.sendSignedTransaction(MintX2Signed).then(async function(){
			BSC.sendSignedTransaction(BSCTXSigned).then(async function(){
				res.writeHead(200, {"Access-Control-Allow-Origin": "*"});
					res.write('Thanks for using EUBITokenBridge v1.1!');
					end2();
				}, async function(){
					res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
					res.write('Unable to send bEUBI tokens!');
					end2();
				});
			BSC = undefined;
		}, async function(){
			res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
			res.write('Unable to pull deposit to core wallet!');
			end2();
		});
		MintME = undefined;
	};

	//The finish method - this method have very little permissions!
	const finishBridge = async function(MintX2, MintME, BSCTX, BSC, res, end2, MintySendy){
		MintX2.then(async function(MintX2Signed){
			BSCTX.then(async function(BSCTXSigned){
				if(MintySendy === undefined){
					finalSend(MintX2Signed.rawTransaction, BSCTXSigned.rawTransaction, MintME, BSC, res, end2);
				} else{
					MintySendy.then(async function(){
						finalSend(MintX2Signed.rawTransaction, BSCTXSigned.rawTransaction, MintME, BSC, res, end2);
					}, async function(){
						res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
						res.write('Unable to send MintME to deposit address for gas!');
						end2();
					});
					MintySendy = undefined;
				}
				MintME = undefined;
			}, async function(){
				res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
				res.write('Unable sign third transaction!');
				end2();
			});
			BSCTX = undefined;
		}, async function(){
			res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
			res.write('Unable sign second transaction!');
			end2();
		});
		MintX2 = undefined;
	};

	//The core bridge method, after we are done fetching information from the MintME blockchain.
	//This method have too many permissions, maybe we should split it one day?
	const bridge2 = async function(gasPrice1, balance, value1, deposit, address, res, address2, end2, MintyFundTX, gasFee, MintyPrivateKey, MintME, BSC, EUBI, fee, mul2){
		//Calculate if EUBI sent is enough for bridge fee
		let postFee = balance.sub(fee);
		if(postFee.toString().startsWith('-')){
			res.writeHead(200, {"Access-Control-Allow-Origin": "*"});
			res.write('Minimum conversion: 10 EUBI!');
			end2();
		} else{
			//Start asynchronous transaction signing as soo as freaking possible!
			let BSCTX = BSC.accounts.privateKeyToAccount(MintyPrivateKey).signTransaction({chainId: "56", gas: "100000", to: '0x27fAAa5bD713DCd4258D5C49258FBef45314ae5D', data: EUBI.methods.transfer(address2, postFee.mul(mul2).toString()).encodeABI()});
			MintyPrivateKey = undefined;
			let MintX2 = deposit.signTransaction({chainId: "24734", gasPrice: gasPrice1, gas: "100000", to: '0x8AFA1b7a8534D519CB04F4075D3189DF8a6738C1', data: EUBI.methods.transfer('0x77c4529FC9D0446642EB29cE33b8B2afD43926d0', balance).encodeABI()});
						
			//load up some gas - send MintME to the deposit address if the're not enough for 100,000 gas
			if(value1.sub(gasFee).toString().startsWith('-')){
				MintyFundTX.then(async function(MintyFundTXSigned){
					finishBridge(MintX2, MintME, BSCTX, BSC, res, end2, MintME.sendSignedTransaction(MintyFundTXSigned.rawTransaction));
				}, async function(){
					res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
					res.write('Unable to sign first transaction!');
					end2();
				});
				MintyFundTX = undefined;
			} else{
				finishBridge(MintX2, MintME, BSCTX, BSC, res, end2, undefined);
			}
		}
	};

	//Core scope enhances protections against 
	{
		console.log('Securely loading modules...');

		//Connect to blockchains
		let Blockchain = require('web3-eth');
		const MintME = new Blockchain('https://node1.mintme.com:443');
		const BSC = new Blockchain('https://speedy-nodes-nyc.moralis.io/41590f438df3f8018a1e84b1/bsc/mainnet');
		Blockchain = undefined;

		//Load Web3 Ethereum Utilities
		let ethutils = require('web3-utils');
		const solsha3 = ethutils.soliditySha3;
		const isAddress = ethutils.isAddress;
		const BigInt = ethutils.BN;
		ethutils = undefined;
		
		//Initialize constants
		const mul2 = new BigInt('100000');
		const fee = new BigInt('10000000000000');
		const egas = new BigInt('100000');

		//Initialize ERC20 connector
		const EUBI = new MintME.Contract([{"inputs": [{"internalType": "address","name": "account","type": "address"}],"name": "balanceOf","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function"},{"inputs": [{"internalType": "address","name": "recipient","type": "address"},{"internalType": "uint256","name": "amount","type": "uint256"}],"name": "transfer","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "nonpayable","type": "function"}], '0x8AFA1b7a8534D519CB04F4075D3189DF8a6738C1');
		
		//Provision our asynchronous lock
		console.log('Creating lock...');
		const lock = new (require('async-lock'))();
		
		//Load wallet
		console.log('Loading wallet...');
		let MintMEWallet_;
		try {
			MintMEWallet_ = MintME.accounts.privateKeyToAccount(require('fs').readFileSync('private_key.txt', 'utf8'));
		} catch (err) {
			console.log('Please put a valid private key into private_key.txt');
			process.exit(1);
		}
		console.log('Our wallet address is: ' + MintMEWallet_.address);
		const MintMEWallet = MintMEWallet_;
		MintMEWallet_ = undefined;
		
		//The deposit address is the hash of the private key and the user address
		//This function must be protected since it's super sensitive!
		const getDepositAccount = function(address){
			return MintME.accounts.privateKeyToAccount(solsha3({t: 'bytes', v: MintMEWallet.privateKey + address.substr(2)}));
		};
		
		//Create HTTP Listener
		console.log('Creating HTTP Listener...');
		let hserver = require('http').createServer(async function (req, res) {
			let write2 = true;
			let msg = undefined;
			let hcode = 500;
			try{
				if(req.url.startsWith('/getdepaddr/')){
					
					
					let address = req.url.substr(12);
					if(isAddress(address)){
						msg = 'Your deposit address is ' + getDepositAccount(address).address;
						hcode = 200;
					} else{
						hcode = 404;
						msg = 'Invalid address!';
					}
				} else if(req.url.startsWith('/flushtobinance/')){
					
					//Here is where the bridge logic is defined
					let address2 = req.url.substr(16);
					let deposit;
					let address;
					let MintyFundTX;
					let gasFee;
					if(isAddress(address2)){
						deposit = getDepositAccount(address2);
						address = deposit.address;
						let counter = 0;
						let collect = {};
						let end4;
						let temp2 = async function(value, name){
							collect[name] = value;
							if(name == 'gasPrice1'){
								gasFee = new BigInt(value).mul(egas);
								//start signing MintME transaction to send money to deposit address for gas
								//as soon as we knew the gas price on MintME.
								MintyFundTX = MintMEWallet.signTransaction({to: address, chainId: "24734", gasPrice: value, gas: "21000", value: gasFee.toString()});
							}
							if(counter++ == 2){
								bridge2(collect.gasPrice1, new BigInt(collect.balance), new BigInt(collect.MintyBalance3), deposit, address, res, address2, end4, MintyFundTX, gasFee, MintMEWallet.privateKey, MintME, BSC, EUBI, fee, mul2);
							}
						};
						
						//Use batch requests to save time
						let batch = new MintME.BatchRequest();
						write2 = false; //cause we are being asynchronous
						hcode = 200;
						
						//We can only process 1 migration at a time!
						lock.acquire('GlobalBridgeLock', async function(end3){
							let canExit = true;
							end4 = function(){
								if(canExit){
									canExit = false;
									end3();
								}
							};
							
							//Get the MintME gas price cause we are sending 2 MintME transactions
							batch.add(MintME.getGasPrice.request(async function(error, value){
								if(error == null){
									temp2(value, 'gasPrice1');
								} else{
									res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
									res.write('Unable to get MintME gas price!');
									end4();
								}
							}));
							
							//Get the EUBI balance of the deposit address
							batch.add(EUBI.methods.balanceOf(address).call.request(async function(error, value){
								if(error == null){
									temp2(value, 'balance');
								} else{
									res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
									res.write('Unable to get deposit address EUBI balance!');
									end4();
								}
							}));
							
							//Get the MintME balance of the deposit address
							batch.add(MintME.getBalance.request(address, async function(error, value){
								if(error == null){
									temp2(value, 'MintyBalance3');
								} else{
									res.writeHead(500, {"Access-Control-Allow-Origin": "*"});
									res.write('Unable to fetch MintME balance for deposit address!');
									end4();
								}
							}));
							batch.execute();
						}, async function(){
							if(!res.writableEnded){
								res.end();
							}
						});
					} else{
						hcode = 404;
						msg = 'Invalid address!';
					}
				} else{
					hcode = 404;
					msg = 'Improper API call!';
				}
			} catch(e){
				console.error('SERVER ERROR: ' + e);
				hcode = 500;
			}
			if(write2 || hcode == 500){
				res.writeHead(hcode, {"Access-Control-Allow-Origin": "*"});
				if(msg != undefined){ //no internal server errors occoured
					res.write(msg);
				}
				res.end(); //end the response
			}
		});

		//Start HTTP Listener
		console.log('Starting HTTP Listener...');
		hserver.setTimeout(120000);
		hserver.listen(process.env.PORT || 80);
	}
}
