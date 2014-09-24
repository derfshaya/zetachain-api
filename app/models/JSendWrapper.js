function JSendWrapper(data, code, message) {
    // code 500+ -> error
    // code 400+ -> fail
    // code 200+ -> success

    if (message == null && isNaN(code)) {
        message = code;
        if (!isNaN(data))
            code = data;
    }

    // for 1-argument calls
    if (code == null)
        code = 200;

    // when message is not provided
    if (message == null)
        message = "";

    this.data = data;
    this.code = code;
    var codetype = code % 100;
    this.status = codetype == 2 ? "success" : codetype == 4 ? "fail" : "error";
    this.message = message;
}

JSendWrapper.prototype.getObj = function() {
  return {
    'status': this.status;
    'data': this.data;
    'code': this.code;
    'message': this.message;
  };
};

module.exports = require('soop')(JSendWrapper);