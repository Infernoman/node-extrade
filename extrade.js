var Extrade = require('extrade');
var SafeCex = new Extrade({apiKey:'APIKEY', apiSecret:'APISECRET'}, 'safecex.com');
var Extrade = new Extrade({apiKey:'APIKEY', apiSecret:'APISECRET'}, '1ex.trade');
var Bittrex = require('node.bittrex.api');
var Bittrex2 = require('node.bittrex.api');
var async = require('async');
var winston = require('winston');

//var crypto = require('crypto');
//var querystring = require('querystring');

// load winston's cli defaults
winston.cli();

var timeout = 20*1000;
var percentGain = 1;

Bittrex.options({
  'apikey': 'APIKEY',
  'apisecret': 'APISECRET',
  'stream': true,
  'verbose': false,
  'cleartext': true,
  'baseUrl': 'https://bittrex.com/api/v1.1'
});

//Arb();
setInterval(function(){
//Arb();
}, timeout);

ExtradeBuy3();

function ExtradeBuy3() {
    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'buy',
            type: 'limit',
            limit_price: 0.000025,
            amount: 25
        }, 'POST', function (err, extradeResponse) {
            if (err)
                console.log(err);
            else
                console.log(extradeResponse);
        });
}



// BuyExtradeSellBittrex
function ExtradeBuy(bittrex, extrade, callback) {
	if (bittrex.result.sell[0].Quantity > extrade['order-book'].bid[0]['order_amount']) {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'buy',
            type: 'limit',
            limit_price: extrade['order-book'].ask[0].price,
            amount: extrade['order-book'].ask[0]['order_amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
                winston.warn("Purchased "
                    +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
                    +" Transfercoin for "
                    +extrade['order-book'].ask[0].price
                    +" from ExTrade");
                callback(null);
            } else {
                if (err == "Couldn't connect to exchange.") {
                    winston.error("ExtradeBuy - Error: "+err);
                    callback(null, "ExtradeBuy - Error: "+err);
                } else {
                    winston.error("ExtradeBuy - Error: "+err);
                    callback("ExtradeBuy - Error: "+err);
                }
            }
        })
	} else {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'buy',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: bittrex.result.sell[0].Quantity
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
                winston.warn("Purchased "
        	        +parseFloat(bittrex.result.sell[0].Quantity).toFixed(8)
        	        +" Transfercoin for "
        	        +extrade['order-book'].ask[0].price
        	        +" from ExTrade");
                callback(null);
            } else {
        	    if (err == "Couldn't connect to exchange.") {
        	    	winston.error("ExtradeBuy - Error: "+err);
        	    	callback(null, "ExtradeBuy - Error: "+err);
        	    } else {
        	    	winston.error("ExtradeBuy - Error: "+err);
        	    	callback("ExtradeBuy - Error: "+err);
        	    }
            }
        })
	}
}

function BittrexSell(bittrex, extrade, callback) {
	if (bittrex.result.sell[0].Quantity > extrade['order-book'].bid[0]['order_amount']) {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/selllimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +extrade['order-book'].ask[0]['order_amount']
            +'&rate='+bittrex.result.buy[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Sold "
                    +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback("Arbitrage successful: Extrade->Bittrex. Btc Gained: "+parseFloat((parseFloat(bittrex.result.buy[0].Rate).toFixed(8) - parseFloat(extrade['order-book'].ask[0].price).toFixed(8)) * parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)).toFixed(8));
            } else {
            	if (data.message == 'INSUFFICIENT_FUNDS') {
            		winston.error("BittrexSell - Error: "+data.message);
        	        callback(null, "BittrexSell - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexSell - Error: "+data.message);
        	        callback("BittrexSell - Error:"+data.message);
        	    }
            }
        }, true)
    } else {
    	Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/selllimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +bittrex.result.buy[0].Quantity
            +'&rate='+bittrex.result.buy[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Sold "
                    +parseFloat(bittrex.result.buy[0].Quantity).toFixed(8)
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback("Arbitrage successful: Extrade->Bittrex. Btc Gained: "+parseFloat((parseFloat(bittrex.result.buy[0].Rate).toFixed(8) - parseFloat(extrade['order-book'].ask[0].price).toFixed(8)) * parseFloat(bittrex.result.buy[0].Quantity).toFixed(8)).toFixed(8));
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
            		winston.error("BittrexSell - Error: "+data.message);
        	        callback(null, "BittrexSell - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexSell - Error: "+data.message);
        	        callback("BittrexSell - Error:"+data.message);
        	    }
            }
        }, true)
    }
}



// BuyBittrexSellExtrade
function BittrexBuy(bittrex, extrade, callback) {
	if (extrade['order-book'].bid[0]['order_amount'] > bittrex.result.sell[0].Quantity) {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/buylimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +bittrex.result.sell[0].Quantity
            +'&rate='+bittrex.result.sell[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Purchased "
                    +bittrex.result.sell[0].Quantity
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback(null);
            } else {
            	if (data.message == 'INSUFFICIENT_FUNDS') {
            		winston.error("BittrexBuy - Error: "+data.message);
        	    	callback(null, "BittrexBuy - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexBuy - Error: "+data.message);
        	    	callback("BittrexBuy - Error:"+data.message);
        	    }
            }
        }, true)
    } else {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/buylimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +extrade['order-book'].bid[0]['order_amount']
            +'&rate='+bittrex.result.sell[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Purchased "
                    +extrade['order-book'].bid[0]['order_amount']
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback();
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
            		winston.error("BittrexBuy - Error: "+data.message);
        	    	callback(null, "BittrexBuy - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexBuy - Error: "+data.message);
        	    	callback("BittrexBuy - Error:"+data.message);
        	    }
            }
        }, true)
    }
}

function ExtradeSell(bittrex, extrade, callback) {
	if (extrade['order-book'].bid[0]['order_amount'] > bittrex.result.sell[0].Quantity) {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'sell',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: bittrex.result.sell[0].Quantity
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +bittrex.result.sell[0].Quantity
    		        +" Transfercoin for "
    		        +extrade['order-book'].bid[0].price
    		        +" on Extrade");
    	        callback("Arbitrage successful: Bittrex->Extrade. Btc Gained: "+parseFloat((parseFloat(extrade['order-book'].ask[0].price).toFixed(8) - parseFloat(bittrex.result.buy[0].Rate).toFixed(8)) * parseFloat(bittrex.result.sell[0].Quantity).toFixed(8)).toFixed(8));
    	    } else {
    	    	if (err == "Couldn't connect to exchange.") {
    	    		winston.error("ExtradeSell - Error: "+err);
    	    		callback(null, "ExtradeSell - Error:"+err);
    		    } else {
    		    	winston.error("ExtradeSell - Error: "+err);
    		    	callback("ExtradeSell - Error:"+err);
    		    }
    	    }
        });
    } else {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'sell',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: extrade['order-book'].bid[0]['order_amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +extrade['order-book'].bid[0]['order_amount']
    		        +" Transfercoin for "
    		        +extrade['order-book'].bid[0].price
    		        +" on Extrade");
                callback("Arbitrage successful: Bittrex->Extrade. Btc Gained: "+parseFloat((parseFloat(extrade['order-book'].ask[0].price).toFixed(8) - parseFloat(bittrex.result.buy[0].Rate).toFixed(8)) * parseFloat(extrade['order-book'].bid[0]['order_amount']).toFixed(8)).toFixed(8));
    	    } else {
    	    	if (err == "Couldn't connect to exchange.") {
    	    		winston.error("ExtradeSell - Error: "+err);
    	    		callback(null, "ExtradeSell - Error:"+err);
    		    } else {
    		    	winston.error("ExtradeSell - Error: "+err);
    		    	callback("ExtradeSell - Error:"+err);
    		    }
    	    }
        });
    }
}



// BuySafeCexSellBittrex
function SafeCexBuy(bittrex, safecex, callback) {
	if (bittrex.result.sell[0].Quantity > safecex.bids[0]['amount']) {
	    SafeCex.connect('buylimit', {
            market: 'TX/BTC',
            limit_price: safecex.asks[0].price,
            amount: safecex.asks[0]['amount']
        }, 'POST', function (err, safecexResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(safecex.asks[0]['amount']).toFixed(8)
    		        +" Transfercoin for "
    		        +safecex.asks[0].price
    		        +" from SafeCex");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexBuy - Error: "+err);
    		    	callback(null, "SafeCexBuy - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexBuy - Error: "+err);
    		    	callback("SafeCexBuy - Error: "+err);
    		    }
    	    }
        })
	} else {
	    SafeCex.connect('buylimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: bittrex.result.sell[0].Quantity
        }, 'POST', function (err, safecexResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(bittrex.result.sell[0].Quantity).toFixed(8)
    		        +" Transfercoin for "
    		        +safecex.asks[0].price
    		        +" from SafeCex");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexBuy - Error: "+err);
    		    	callback(null, "SafeCexBuy - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexBuy - Error: "+err);
    		    	callback("SafeCexBuy - Error: "+err);
    		    }
    	    }
        })
	}
}

function BittrexSell2(bittrex, safecex, callback) {
	if (bittrex.result.sell[0].Quantity > safecex.bids[0]['amount']) {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/selllimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +safecex.asks[0]['amount']
            +'&rate='+bittrex.result.buy[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Sold "
                    +parseFloat(safecex.asks[0]['amount']).toFixed(8)
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback("Arbitrage successful: SafeCex->Bittrex. Btc Gained: "+parseFloat((parseFloat(bittrex.result.buy[0].Rate).toFixed(8) - parseFloat(safecex.asks[0].price).toFixed(8)) * parseFloat(safecex.asks[0]['amount']).toFixed(8)).toFixed(8));
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
        	    	winston.error("BittrexSell2 - Error: "+data.message);
        	        callback(null, "BittrexSell2 - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexSell2 - Error: "+data.message);
        	    	callback("BittrexSell2 - Error:"+data.message);
        	    }
            }
        }, true)
    } else {
    	Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/selllimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +bittrex.result.buy[0].Quantity
            +'&rate='+bittrex.result.buy[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Sold "
                    +parseFloat(bittrex.result.buy[0].Quantity).toFixed(8)
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback("Arbitrage successful: SafeCex->Bittrex. Btc Gained: "+parseFloat((parseFloat(bittrex.result.buy[0].Rate).toFixed(8) - parseFloat(safecex.asks[0].price).toFixed(8)) * parseFloat(safecex.asks[0]['amount']).toFixed(8)).toFixed(8));
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
        	    	winston.error("BittrexSell2 - Error: "+data.message);
        	        callback(null, "BittrexSell2 - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexSell2 - Error: "+data.message);
        	    	callback("BittrexSell2 - Error:"+data.message);
        	    }
            }
        }, true)
    }
}



// BuyBittrexSellSafeCex
function BittrexBuy2(bittrex, safecex, callback) {
	if (safecex.bids[0]['amount'] > bittrex.result.sell[0].Quantity) {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/buylimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +bittrex.result.sell[0].Quantity
            +'&rate='+bittrex.result.sell[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Purchased "
                    +bittrex.result.sell[0].Quantity
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback(null);
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
        	    	winston.error("BittrexBuy2 - Error: "+data.message);
        	    	callback(null, "BittrexBuy2 - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexBuy2 - Error: "+data.message);
        	    	callback("BittrexBuy2 - Error:"+data.message);
        	    }
            }
        }, true)
    } else {
        Bittrex.sendCustomRequest( 'https://bittrex.com/api/v1.1/market/buylimit?apikey='+Bittrex.options.apikey+'&market=BTC-TX&quantity='
            +safecex.bids[0]['amount']
            +'&rate='+bittrex.result.sell[0].Rate,
        function( data ) {
    	    if (data.success == true) {
                winston.warn("Purchased "
                    +safecex.bids[0]['amount']
    	            +" Transfercoin for "
    	            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
    	            +" on Bittrex");
                callback(null);
            } else {
        	    if (data.message == 'INSUFFICIENT_FUNDS') {
        	    	winston.error("BittrexBuy2 - Error: "+data.message);
        	    	callback(null, "BittrexBuy2 - Error:"+data.message);
        	    } else {
        	    	winston.error("BittrexBuy2 - Error: "+data.message);
        	    	callback("BittrexBuy2 - Error:"+data.message);
        	    }
            }
        }, true)
    }
}

function SafecexSell(bittrex, safecex, callback) {
	if (safecex.bids[0]['amount'] > bittrex.result.sell[0].Quantity) {
	    SafeCex.connect('selllimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: bittrex.result.sell[0].Quantity
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +bittrex.result.sell[0].Quantity
    		        +" Transfercoin for "
    		        +safecex.bids[0].price
    		        +" on SafeCex");
    	            callback("Arbitrage successful: Bittrex->SafeCex. Btc Gained: "+parseFloat((parseFloat(safecex.asks[0].price).toFixed(8) - parseFloat(bittrex.result.buy[0].Rate).toFixed(8)) * parseFloat(safecex.bids[0]['amount']).toFixed(8)).toFixed(8));
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexSell - Error: "+err);
    		    	callback(null, "SafeCexSell - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexSell - Error: "+err);
    		    	callback("SafeCexSell - Error: "+err);
    		    }
    	    }
        });
    } else {
	    SafeCex.connect('selllimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: safecex.bids[0]['amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +safecex.bids[0]['amount']
    		        +" Transfercoin for "
    		        +safecex.bids[0].price
    		        +" on SafeCex");
    	        callback("Arbitrage successful: Bittrex->SafeCex. Btc Gained: "+parseFloat((parseFloat(safecex.asks[0].price).toFixed(8) - parseFloat(bittrex.result.buy[0].Rate).toFixed(8)) * parseFloat(safecex.bids[0]['amount']).toFixed(8)).toFixed(8));
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexSell - Error: "+err);
    		    	callback(null, "SafeCexSell - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexSell - Error: "+err);
    		    	callback("SafeCexSell - Error: "+err);
    		    }
    	    }
        });
    }
}



// BuyExtradeSellSafeCex
function ExtradeBuy2(extrade, safecex, callback) {
	if (safecex.asks[0].amount > extrade['order-book'].bid[0]['order_amount']) {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'buy',
            type: 'limit',
            limit_price: extrade['order-book'].ask[0].price,
            amount: extrade['order-book'].ask[0]['order_amount']
        }, 'POST', function (err, extradeResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
    		        +" Transfercoin for "
    		        +extrade['order-book'].ask[0].price
    		        +" from ExTrade");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("ExtradeBuy2 - Error: "+err);
    		    	callback(null, "ExtradeBuy2 - Error: "+err);
    		    } else {
    		    	winston.error("ExtradeBuy2 - Error: "+err);
    		    	callback("ExtradeBuy2 - Error: "+err);
    		    }
    	    }
        })
	} else {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'buy',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: safecex.asks[0].amount
        }, 'POST', function (err, extradeResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(safecex.asks[0].amount).toFixed(8)
    		        +" Transfercoin for "
    		        +extrade['order-book'].ask[0].price
    		        +" from ExTrade");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("ExtradeBuy2 - Error: "+err);
    		    	callback(null, "ExtradeBuy2 - Error: "+err);
    		    } else {
    		    	winston.error("ExtradeBuy2 - Error: "+err);
    		    	callback("ExtradeBuy2 - Error: "+err);
    		    }
    	    }
        })
	}
}

function SafecexSell2(extrade, safecex, callback) {
	if (safecex.bids[0]['amount'] > extrade['order-book'].ask[0]['order_amount']) {
	    SafeCex.connect('selllimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: extrade['order-book'].ask[0]['order_amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +extrade['order-book'].ask[0]['order_amount']
    		        +" Transfercoin for "
    		        +safecex.bids[0].price
    		        +" on SafeCex");
    	            callback("Arbitrage successful: Extrade->SafeCex. Btc Gained: "+parseFloat((parseFloat(safecex.asks[0].price).toFixed(8) - parseFloat(extrade['order-book'].bid[0].price).toFixed(8)) * parseFloat(safecex.bids[0]['amount']).toFixed(8)).toFixed(8));
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexSell2 - Error: "+err);
    		    	callback(null, "SafeCexSell2 - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexSell2 - Error: "+err);
    		    	callback("SafeCexSell2 - Error: "+err);
    		    }
    	    }
        });
    } else {
	    SafeCex.connect('selllimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: safecex.bids[0]['amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +safecex.bids[0]['amount']
    		        +" Transfercoin for "
    		        +safecex.bids[0].price
    		        +" on SafeCex");
    	        callback("Arbitrage successful: Extrade->SafeCex. Btc Gained: "+parseFloat((parseFloat(safecex.asks[0].price).toFixed(8) - parseFloat(extrade['order-book'].bid[0].price)) * parseFloat(safecex.bids[0]['amount']).toFixed(8)).toFixed(8));
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexSell2 - Error: "+err);
    		    	callback(null, "SafeCexSell2 - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexSell2 - Error: "+err);
    		    	callback("SafeCexSell2 - Error: "+err);
    		    }
    	    }
        });
    }
}



// BuySafeCexSellExtrade NEEDS EDITED
function SafeCexBuy2(extrade, safecex, callback) {
	if (extrade['order-book'].ask[0]['order_amount'] > safecex.bids[0]['amount']) {
	    SafeCex.connect('buylimit', {
            market: 'TX/BTC',
            limit_price: safecex.asks[0].price,
            amount: safecex.asks[0]['amount']
        }, 'POST', function (err, safecexResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(safecex.asks[0]['amount']).toFixed(8)
    		        +" Transfercoin for "
    		        +safecex.asks[0].price
    		        +" from SafeCex");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexBuy2 - Error: "+err);
    		    	callback(null, "SafeCexBuy2 - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexBuy2 - Error: "+err);
    		    	callback("SafeCexBuy2 - Error: "+err);
    		    }
    	    }
        })
	} else {
	    SafeCex.connect('buylimit', {
            market: 'TX/BTC',
            limit_price: safecex.bids[0].price,
            amount: extrade['order-book'].ask[0]['order_amount']
        }, 'POST', function (err, safecexResponse) {
    	    if (err == null) {
    	        winston.warn("Purchased "
    		        +parseFloat(extrade['order-book'].ask[0]['order_amount']).toFixed(8)
    		        +" Transfercoin for "
    		        +safecex.asks[0].price
    		        +" from SafeCex");
    	        callback(null);
    	    } else {
    		    if (err == "Couldn't connect to exchange.") {
    		    	winston.error("SafeCexBuy2 - Error: "+err);
    		    	callback(null, "SafeCexBuy2 - Error: "+err);
    		    } else {
    		    	winston.error("SafeCexBuy2 - Error: "+err);
    		    	callback("SafeCexBuy2 - Error: "+err);
    		    }
    	    }
        })
	}
}

function ExtradeSell2(extrade, safecex, callback) {
	if (extrade['order-book'].bid[0]['order_amount'] > safecex.asks[0].amount) {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'sell',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: safecex.asks[0].amount
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +safecex.asks[0].amount
    		        +" Transfercoin for "
    		        +extrade['order-book'].bid[0].price
    		        +" on Extrade");
    	        callback("Arbitrage successful: SafeCex->Extrade. Btc Gained: "+parseFloat((parseFloat(extrade['order-book'].ask[0].price).toFixed(8) - parseFloat(safecex.bids[0].price).toFixed(8)) * parseFloat(safecex.asks[0].amount).toFixed(8)).toFixed(8));
    	    } else {
    	    	if (err == "Couldn't connect to exchange.") {
    	    		winston.error("ExtradeSell2 - Error: "+err);
    	    		callback(null, "ExtradeSell2 - Error:"+err);
    		    } else {
    		    	winston.error("ExtradeSell2 - Error: "+err);
    		    	callback("ExtradeSell2 - Error:"+err);
    		    }
    	    }
        });
    } else {
	    Extrade.connect('orders/new', {
            currency: 'BTC',
            market: 'TX',
            side: 'sell',
            type: 'limit',
            limit_price: extrade['order-book'].bid[0].price,
            amount: extrade['order-book'].bid[0]['order_amount']
        }, 'POST', function (err, extradeResponse) {
            if (err == null) {
    	        winston.warn("Sold "
    		        +extrade['order-book'].bid[0]['order_amount']
    		        +" Transfercoin for "
    		        +extrade['order-book'].bid[0].price
    		        +" on Extrade");
                callback("Arbitrage successful: SafeCex->Extrade. Btc Gained: "+parseFloat((parseFloat(extrade['order-book'].ask[0].price).toFixed(8) - parseFloat(safecex.bids[0].Rate).toFixed(8)) * parseFloat(extrade['order-book'].bid[0]['order_amount']).toFixed(8)).toFixed(8));
    	    } else {
    	    	if (err == "Couldn't connect to exchange.") {
    	    		winston.error("ExtradeSell2 - Error: "+err);
    	    		callback(null, "ExtradeSell2 - Error:"+err);
    		    } else {
    		    	winston.error("ExtradeSell2 - Error: "+err);
    		    	callback("ExtradeSell2 - Error:"+err);
    		    }
    	    }
        });
    }
}



function Arb() {
	Extrade.connect('order-book', { currency: 'BTC', market: 'TX' }, 'GET', function (extradeErr, extrade) {
	    Bittrex.getorderbook({ market: 'BTC-TX', type: 'both', depth: '10' }, function(bittrex) {
	    	SafeCex.connect('getorderbook', {market: 'TX/BTC'}, 'GET', function (safecexErr, safecex) {
	    		if (extradeErr)
	    		    console.log("Error while trying to get the order book from Extrade: " +extradeErr);
	    		if (safecexErr)
	    			console.log("Error while trying to get the order book from SafeCex: " +safecexErr);
	            if (extrade && bittrex.result && safecex){
	        	    async.series([
	        		    function(callback){
	        			    BuyExtradeSellBittrex(extrade, bittrex, callback)
	        		    },
	        		    function(callback){
	        			    BuyBittrexSellExtrade(extrade, bittrex, callback)
	        		    },
	        		    function(callback) {
	        			    BuySafeCexSellBittrex(safecex, bittrex, callback)
	        		    },
	        		    function(callback) {
	        			    BuyBittrexSellSafeCex(safecex, bittrex, callback)
	        		    },
	        		    function(callback) {
	        			    BuyExtradeSellSafeCex(extrade, safecex, callback)
	        		    },
	        		    function(callback) {
	        			    BuySafeCexSellExtrade(extrade, safecex, callback)
	        		    }
	        	    ], function(err, results){
                        if (err) {
                        	if (err.indexOf("Arbitrage successful:") == 0){
                        		winston.info(err);
                        	} else {
                                winston.error(err);
	        	    		}
	                    } else {
	                    	console.log('');
	                        for (i in results) {
	                            winston.info(results[i]);
	                        }
	                        console.log('\n\n');
	                    }
	        	    })
	            }
	        }, true);
	    });
    });
}




function BuyExtradeSellBittrex(extrade, bittrex, callback) {
    if (extrade['order-book'].ask[0].price < bittrex.result.buy[0].Rate){
        if (parseFloat(((bittrex.result.buy[0].Rate / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    ExtradeBuy(bittrex, extrade, callback)
                }, function(callback){
                    BittrexSell(bittrex, extrade, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((bittrex.result.buy[0].Rate / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4)
                +"% gain for buying on ExTrade("+extrade['order-book'].ask[0].price
                +") and selling on Bittrex("+parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
                +")" +' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on ExTrade("
            +extrade['order-book'].ask[0].price
            +") and selling on Bittrex("
            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
            +")");
    }
}

function BuyBittrexSellExtrade(extrade, bittrex, callback) {
    if (bittrex.result.sell[0].Rate < extrade['order-book'].bid[0].price){
        if (parseFloat(((extrade['order-book'].bid[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    BittrexBuy(bittrex, extrade, callback)
                }, function(callback){
                    ExtradeSell(bittrex, extrade, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((extrade['order-book'].bid[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4)
                +"% gain for buying on Bittrex("+parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
                +") and selling on ExTrade("+extrade['order-book'].bid[0].price
                +")" + ' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on Bittrex("
            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
            +") and selling on ExTrade("
            +extrade['order-book'].bid[0].price
            +")");
    }
}

function BuySafeCexSellBittrex(safecex, bittrex, callback) {
    if (safecex.asks[0].price < bittrex.result.buy[0].Rate){
        if (parseFloat(((bittrex.result.buy[0].Rate / safecex.asks[0].price) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    SafeCexBuy(bittrex, safecex, callback)
                }, function(callback){
                    BittrexSell2(bittrex, safecex, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((bittrex.result.buy[0].Rate / safecex.asks[0].price) * 100) - 100).toFixed(4)
                +"% gain for buying on SafeCex("+safecex.asks[0].price
                +") and selling on Bittrex("+parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
                +")" + ' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on SafeCex("
            +safecex.asks[0].price
            +") and selling on Bittrex("
            +parseFloat(bittrex.result.buy[0].Rate).toFixed(8)
            +")");
    }
}

function BuyBittrexSellSafeCex(safecex, bittrex, callback) {
    if (bittrex.result.sell[0].Rate < safecex.bids[0].price){
        if (parseFloat(((safecex.bids[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    BittrexBuy2(bittrex, safecex, callback)
                }, function(callback){
                    SafeCexSell(bittrex, safecex, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((safecex.bids[0].price / bittrex.result.sell[0].Rate) * 100) - 100).toFixed(4)
                +"% gain for buying on Bittrex("+parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
                +") and selling on SafeCex("+safecex.bids[0].price
                +")" + ' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on Bittrex("
            +parseFloat(bittrex.result.sell[0].Rate).toFixed(8)
            +") and selling on SafeCex("
            +safecex.bids[0].price
            +")");
    }
}

function BuyExtradeSellSafeCex(extrade, safecex, callback) {
    if (extrade['order-book'].ask[0].price < safecex.bids[0].price){
        if (parseFloat(((safecex.bids[0].price / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    ExtradeBuy2(extrade, safecex, callback)
                }, function(callback){
                    SafeCexSell2(extrade, safecex, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((safecex.bids[0].price / extrade['order-book'].ask[0].price) * 100) - 100).toFixed(4)
                +"% gain for buying on ExTrade("+extrade['order-book'].ask[0].price
                +") and selling on Bittrex("+parseFloat(safecex.bids[0].price).toFixed(8)
                +")" +' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on ExTrade("
            +extrade['order-book'].ask[0].price
            +") and selling on SafeCex("
            +parseFloat(safecex.bids[0].price).toFixed(8)
            +")");
    }
}

function BuySafeCexSellExtrade(extrade, safecex, callback) {
    if (safecex.asks[0].price < extrade['order-book'].bid[0].price){
        if (parseFloat(((extrade['order-book'].bid[0].price / safecex.asks[0].price) * 100) - 100).toFixed(4) > percentGain) {
            async.series([
                function(callback){
                    SafeCexBuy2(extrade, safecex, callback)
                }, function(callback){
                    ExtradeSell2(extrade, safecex, callback)
                }
            ],function(err, results){
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        } else {
        	callback(null, "Arb opportunity. "
                +parseFloat(((extrade['order-book'].bid[0].price / safecex.asks[0].price) * 100) - 100).toFixed(4)
                +"% gain for buying on SafeCex("+parseFloat(safecex.asks[0].price).toFixed(8)
                +") and selling on ExTrade("+extrade['order-book'].bid[0].price
                +")" + ' Waiting until higher than '+percentGain+'% Gain');
        }
    } else {
        callback(null, "No arb opportunities for buying on SafeCex("
            +parseFloat(safecex.asks[0].price).toFixed(8)
            +") and selling on ExTrade("
            +extrade['order-book'].bid[0].price
            +")");
    }
}
