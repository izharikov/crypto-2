var express = require('express');
var router = express.Router();


const ignorePaths = ['/login', '/login-token', '/verify-token', '/login/password', '/login/token/verify', '/login/token/send'];

router.use((req, res, next) => {
    const isPasswordValid = req.session.passwordValid;
    const isTokenVerified = req.session.isTokenVerified;
    if (ignorePaths.indexOf(req.path) !== -1) {
        next();
        return;
    }
    if (isPasswordValid && isTokenVerified) {
        next()
    } else if (isPasswordValid && !isTokenVerified) {
        res.redirect('/login-token')
    } else if (!isPasswordValid && !isTokenVerified) {
        res.redirect('/login')
    }
});

router.get('/login-token', (req, res) => {
    res.render('login-code');
});

const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: '9cb40d9a',
    apiSecret: 'f202c1596ea48c0f'
});

router.post('/login/token/send', (req, res) => {
    let phoneNumber = req.body.number;
    console.log(phoneNumber);
    nexmo.verify.request({number: phoneNumber, brand: 'Awesome Company'}, (err,
                                                                           result) => {
        if (err) {
            res.sendStatus(500);
        } else {
            let requestId = result.request_id;
            res.render('verify-token', {requestId: requestId});
            // if (result.status == '0') {
            //     res.render('verify-token', {requestId: requestId}); // Success! Now, have your user enter the PIN
            // } else {
            //     res.status(401).send(result.error_text);
            // }
        }
    });
});

router.post('/login/token/verify', (req, res) => {
    let pin = req.body.pin;
    let requestId = req.body.requestId;

    nexmo.verify.check({request_id: requestId, code: pin}, (err, result) => {
        if(err) {
            // handle the error
        } else {
            if(result && result.status == '0') { // Success!
                // res.status(200).send('Account verified!');
                req.session.isTokenVerified = true;
                res.redirect('/all-files')
                // res.render('status', {message: 'Account verified! 🎉'});
            } else {
                // handle the error - e.g. wrong PIN
            }
        }
    });
});


module.exports = router;