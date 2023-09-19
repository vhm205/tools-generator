"use stricts";

const useragent         				= require('express-useragent');
const ChildRouter                       = require('../../routing/child_routing');
const USER_SESSION						= require('../../session/user-session');
const { BROWSER_ACCESS, MOBILE_ACCESS } = require('../../utils/constant');

/**
 ** Kiểm tra môi trường BROWSER || MOBILE -> response data
 * @param envAccess môi trường truy cập
 * @param typeResponse
 *  1 - not provide token
 *  2 - token invalid 
 *  3 - permission denied
 * @param res response object
 */
exports.checkAndResponseForEachEnv = ({ envAccess, typeResponse, res }) => {
    console.log({ 'ENVIROMENT': envAccess, typeResponse });
    if (envAccess === BROWSER_ACCESS) {
        // BROWSER WORKSPACE
        switch (typeResponse) {
            case 1:
                return ChildRouter.redirect(res, '/logout');
            case 2:
                return ChildRouter.redirect(res, '/logout');
            case 3:
                return ChildRouter.redirect(res, '/something-went-wrong');
            default:
                return ChildRouter.redirect(res, '/logout');
        }
    }

    // MOBILE WORKSPACE
    switch (typeResponse) {
        case 1:
            return res.status(400).json({ error: true, message: 'not_token_provided' });
        case 2:
            return res.status(401).json({ error: true, message: 'token_invalid'});
        case 3:
            return res.status(403).json({ error: true, message: 'permission_denied'});
        default:
            return res.status(500).json({ error: true, message: 'error_occurred'});
    }
}

exports.isCallerMobile = (req) => {
	let source = req.headers['user-agent'];
    let ua = useragent.parse(source);
    // a Boolean that tells you if the request 
    // is from a mobile device
    const DEVICE_POSTMAN_DEFAULT = 'ldk_postman'; 
    let isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1);
    let isPostman = req.headers['postman_test_sandbox'] == DEVICE_POSTMAN_DEFAULT || 
					(req.headers['postman-token'] && req.headers['postman-token'].length > 0);
    // Lưu ý: sử dụng header postman_test_sandbox: ONLY TEST
    let isMobile  = ua.isMobile || isAjax;
    let isStateLess = isPostman || isMobile;
    return isStateLess;
}

exports.getParams = req => {
    console.log({ ["req.body"]: req.body });
    let session         = USER_SESSION.getUser(req.session);
    let token           = null;
    let envAccess       = BROWSER_ACCESS; // default assign evnAccess BROWSER

    let isMobile = this.isCallerMobile(req);

    if (!session) {
        if (!isMobile) {
            console.log(`-----------💻 BROWSER request(redirect -> /login)--------`)
            envAccess   = BROWSER_ACCESS;
        } else {
            console.log(`-----------📱 MOBILE request--------`)
            token       = req.params.token || 
                              req.body.token || 
                              req.query.token || 
                              req.headers['x-access-token'] || 
                              req.headers.token;
    
            envAccess   = MOBILE_ACCESS;
        }
        
    } else if (session){
        console.log(`-----------💻 BROWSER request--------`)
        token           = session.token;
        envAccess       = BROWSER_ACCESS;
    }

    return {
        token, envAccess
    }
}

exports.getData = req => {
    let description = {};
    if (req.body) {
        description.body = req.body
    }
    let obj = {
        action:      req.method,
        url:         req.originalUrl,
        description: description,
    }

    return obj;
}
