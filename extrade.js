var Extrade = require('extrade');
var Extrade = new Extrade('APIKEY', 'APISECRET');
//var Bittrex = require('node.bittrex.api');
//var Bittrex2 = require('node.bittrex.api');
var async = require('async');

//var crypto = require('crypto');
//var querystring = require('querystring');

/*Bittrex.options({
  'apikey': 'APIKEY',
  'apisecret': 'APISECRET',
  'stream': true,
  'verbose': false,
  'cleartext': true,
  'baseUrl': 'https://bittrex.com/api/v1.1'
});*/

//Arb();
//setInterval(function(){
//Arb();
//}, 20000);

ExtradeBuy2();

function ExtradeBuy2() {
	Extrade.api('orders/new', {
        currency: 'BTC',
        market: 'TX',
        side: 'buy',
        type: 'limit',
        limit_price: '0.000028',
        amount: 25
    }, function (err, extradeResponse) {
        //console.log(err);
    })
}

/*function BittrexBuy(bittrex, extrade, callback) {
    Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/buylimit?apikey=80635e88bcf940df8cc80ddcc55dd772&market=BTC-TX&quantity='
        +extrade['order-book'].bid[0]['order_amount']
        +'&rate='+bittrex.result.buy[0].Rate,
    function( data ) {
    	if (data.success == true) {
            callback(null, "Purchased "
                +extrade['order-book'].bid[0]['order_amount']
    	        +" Transfercoin for "
    	        +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	        +" on Bittrex");
        } else {
        	callback("BittrexBuy - Error:"+data.message);
        }
    }, true)
}

function BittrexSell(bittrex, extrade, callback) {
    Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/selllimit?apikey=80635e88bcf940df8cc80ddcc55dd772&market=BTC-TX&quantity='
        +extrade['order-book'].ask[0]['order_amount']
        +'&rate='+bittrex.result.buy[0].Rate,
    function( data ) {
    	if (data.success == true) {
            callback(null, "Sold "
                +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
    	        +" Transfercoin for "
    	        +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	        +" on Bittrex");
        } else {
        	callback("BittrexSell - Error:"+data.message);
        }
    }, true)
}
function ExtradeBuy(bittrex, extrade, callback) {

	Extrade.api('orders/new', {
        currency: 'BTC',
        market: 'TX',
        side: 'buy',
        type: 'limit',
        limit_price: extrade['order-book'].ask[0].price,
        amount: extrade['order-book'].ask[0]['order_amount']
    }, function (err, extradeResponse) {
    	console.log(extradeResponse);
    	if (extradeResponse.errors[0] == null) {
    	    callback(null, "Purchased "
    		    +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
    		    +" Transfercoin for "
    		    +extrade['order-book'].ask[0].price
    		    +" from ExTrade");
    	} else {
    		callback("ExtradeBuy - Error:"+extradeResponse.errors[0].message);
    	}
    })
}
function ExtradeSell(bittrex, extrade, callback) {
	    Extrade.api('orders/new', {
        currency: 'BTC',
        market: 'TX',
        side: 'sell',
        type: 'limit',
        limit_price: extrade['order-book'].ask[0].price,
        amount: bittrex.result.sell[0].Quantity
    }, function (err, extradeResponse) {
        if (extradeResponse.errors[0] == null) {
    	    callback(null, "Sold "
    		    +bittrex.result.sell[0].Quantity
    		    +" Transfercoin for "
    		    +extrade['order-book'].ask[0].price
    		    +" on Extrade");
    	} else {
    		callback("ExtradeSell - Error:"+extradeResponse.errors[0].message);
    	}
    })
}
function Arb()
{
	Extrade.api('order-book', { currency: 'BTC', market: 'TX' }, function (err, extrade) {
	    Bittrex.getorderbook({ market: 'BTC-TX', type: 'both', depth: '10' }, function(bittrex) {
	        if (extrade['order-book'] && bittrex.result){
		        if (extrade['order-book'].ask[0].price < bittrex.result.buy[0].Rate){
	                console.log("Arb opportunity. "
	                	+parseFloat(((bittrex.result.buy[0].Rate / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4)
	                	+"% gain for buying on ExTrade("+extrade['order-book'].ask[0].price
	                	+") and selling on Bittrex("+parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
	                	+")");
	                if (parseFloat(((bittrex.result.buy[0].Rate / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4) > 1)
	                    async.series([
	                    	function(callback){
                                ExtradeBuy(bittrex, extrade, callback)
                            }, function(callback){
                                BittrexSell(bittrex, extrade, callback)
                            }
	                    ],function(err, results){
	                    	if (err)
	                    		console.log(err+"\n");
	                    	else
	                    		console.log(results+"\n")
	                    });
	            } else {
	            	console.log("No arb opportunities for buying on ExTrade("
	            		+extrade['order-book'].ask[0].price
	            		+") and selling on bittrex("
	            		+parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
	            		+")");
	            }

		        if (bittrex.result.sell[0].Rate < extrade['order-book'].bid[0].price){
	                console.log("Arb opportunity. "
	                	+parseFloat(((extrade['order-book'].bid[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4)
	                	+"% gain for buying on Bittrex("+parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
	                	+") and selling on ExTrade("+extrade['order-book'].bid[0].price
	                	+")");
	                if (parseFloat(((extrade['order-book'].bid[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4) > 1)
	            	    async.series([
	            	    	function(callback){
                                BittrexBuy(bittrex, extrade, callback)
                            }, function(callback){
                                ExtradeSell(bittrex, extrade, callback)
                            }
	                    ],function(err, results){
	                    	if (err)
	                    		console.log(err);
	                    	else
	                    		console.log(results)
	                    });
	            } else {
	            	console.log("No arb opportunities for buying on Bittrex("
	            		+parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
	            		+") and selling on ExTrade("
	            		+extrade['order-book'].bid[0].price
	            		+")\n");
	            }
	        }
	    });
    });
}*/