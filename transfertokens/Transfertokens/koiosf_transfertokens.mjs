import {DomList, getElement, subscribe, setElementVal, LinkClickButton, getElementVal, GetJson} from '../../lib/koiosf_util.mjs';
import {DisplayMessage} from '../../viewer_figma/koiosf_messages.mjs';
import {getUserAddress,getWeb3} from '../../viewer_figma/koiosf_login.mjs'

let useraddresses = new Array;
let tokenamount = new Array;
let usernames;
var globalaccounts;
var tokenfactoryJson;
var tokenJson;
var contracttokenfactory;
var GlobalAddressList = new DomList("transfertokensentry");

window.addEventListener('DOMContentLoaded', onLoad)

async function onLoad() {
    var addresslist=getElement("addresstextboxtext");    
    addresslist.contentEditable="true"; // make div editable
    addresslist.style.whiteSpace ="pre"; 

    var tokenamountlist=getElement("tokenamounttextboxtext");    
    tokenamountlist.contentEditable="true"; // make div editable
    tokenamountlist.style.whiteSpace ="pre"; 
    
    var tokenamountlist=getElement("namestextboxtext");    
    tokenamountlist.contentEditable="true"; // make div editable
    tokenamountlist.style.whiteSpace ="pre"; 
 
    LinkClickButton("confirmbutton",AddElementsToList)
    LinkClickButton("emptylistbutton",EmptyList)  
    LinkClickButton("sendbutton",SendTransaction)

    initContractInformation();
}

async function initContractInformation() {
    subscribe("web3providerfound",NextStep)   
    var tokenfactoryinfo="https://koiosonline.github.io/lib/koiosft/build/contracts/ERC20TokenFactory.json"
	tokenfactoryJson=await GetJson(tokenfactoryinfo)
	console.log(tokenfactoryinfo);
	console.log(tokenfactoryJson)	
	var tokensinfo="https://koiosonline.github.io/lib/koiosft/build/contracts/ERC20Token.json"
	tokenJson=await GetJson(tokensinfo)
	console.log(tokensinfo);
	console.log(tokenJson)	
}

async function NextStep() {
    console.log("In NextStep");
    web3=getWeb3()
    var nid=(await web3.eth.net.getId());
    if (nid !=4) {
        DisplayMessage(`Make sure you are on the Rinkeby network (currently ${nid})`);   
    }    
    globalaccounts = await web3.eth.getAccounts();
	  	  
    var tokenfactorycode=await web3.eth.getCode(tokenfactoryJson.networks[nid].address)
    
    if (tokenfactorycode.length <=2) {       
        console.error("No contract code");        
    } else {
        contracttokenfactory = await new web3.eth.Contract(tokenfactoryJson.abi, tokenfactoryJson.networks[nid].address);
        console.log(contracttokenfactory);
    }
}

async function AddElementsToList() {
    var nameslist=getElementVal("namestextboxtext")
    usernames = nameslist.split(',');
    var addresslist=getElementVal("addresstextboxtext")
    var addresses = addresslist.split(',');
    var tokenlist=getElementVal("tokenamounttextboxtext")
    var tokens = tokenlist.split(',');
    ShowAddresses(usernames,addresses,tokens);
}

async function ShowAddresses(nameslist,addresses,tokenamount) {
    if((nameslist.length == addresses.length) && (tokenamount.length == nameslist.length)) {    
        for (var i=0;i<addresses.length;i++) {
            if ((tokenamount[i] != 0) && 
                (tokenamount[i] != "") && 
                (nameslist[i] != "") &&
                (addresses[i].length == 42)) 
                { // Check for 0, empty and wrong address values
                var target = GlobalAddressList.AddListItem();
                setElementVal("transferusernametext",nameslist[i],target)
                setElementVal("transferuseraddresstext",addresses[i],target)
                setElementVal("transfertokencounttext",tokenamount[i],target)
                var tokenamountlist=getElement("transfertokencounttext",target);    
                tokenamountlist.contentEditable="true"; // make div editable
                tokenamountlist.style.whiteSpace ="pre";
            }
        }
    }
    else {
        console.log("error, difference in listlength");
        console.log(nameslist.length)
        console.log(addresses.length)
        console.log(tokenamount.length)
    }
}

async function EmptyList() {
    GlobalAddressList.EmptyList();
}

async function SendTransaction() {
    await GetAddressInformation();
    console.log(tokenamount);
    console.log(useraddresses);
    var totalTokens = await contracttokenfactory.methods.NrTokens().call();
    for (var i=0;i<totalTokens;i++) {
        var address=await contracttokenfactory.methods.tokens(i).call();
        var contracttoken = await new web3.eth.Contract(tokenJson.abi, address);
        var name = await contracttoken.methods.name().call();
        if (name == "Titan") {
            var decimals = await contracttoken.methods.decimals().call();   
            for (var i=0;i<tokenamount.length;i++) {      
                tokenamount[i] = BigInt(parseInt(tokenamount[i]) * (10**decimals));
                console.log(tokenamount[i]);  
            }
            contracttoken.methods.transferBulk(useraddresses, tokenamount).send({from: globalaccounts[0]});
        }
    }
}

async function GetAddressInformation() {
    var entries=document.getElementsByClassName("transfertokensentry");
    console.log(entries)
    console.log(entries.length)
    for (var i=0;i<entries.length;i++) {
        tokenamount[i] = getElementVal("transfertokencounttext",entries[i])
        useraddresses[i] = getElementVal("transferuseraddresstext",entries[i])
    }
}
