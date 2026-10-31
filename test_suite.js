const EventEmitter = require('events');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./server/config/supabase');
const { app } = require('./index');

function mockRequest(method, url, body = null, headers = {}) {
    return new Promise((resolve) => {
        const req = new EventEmitter();
        req.method = method;
        req.url = url;
        req.headers = { ...headers };
        if (body) {
            req.headers['content-type'] = 'application/json';
        }

        const res = new EventEmitter();
        let resData = '';
        let statusCode = 200;
        let resHeaders = {};

        res.setHeader = (k, v) => { resHeaders[k.toLowerCase()] = v; };
        res.getHeader = (k) => resHeaders[k.toLowerCase()];
        res.status = (code) => { statusCode = code; return res; };
        res.sendStatus = (code) => { statusCode = code; res.end(); };
        res.json = (data) => {
            statusCode = statusCode || 200;
            resolve({ status: statusCode, body: data });
        };
        res.send = (data) => {
            statusCode = statusCode || 200;
            let parsed = data;
            try { parsed = JSON.parse(data); } catch (e) {}
            resolve({ status: statusCode, body: parsed });
        };
        res.end = (chunk) => {
            if (chunk) resData += chunk;
            let parsed = resData;
            try { parsed = JSON.parse(resData); } catch (e) {}
            resolve({ status: statusCode, body: parsed });
        };

        // Express body parser simulation if body provided
        if (body) {
            req.body = body;
        }

        app.handle(req, res);
    });
}

async function runTestSuite() {
    console.log('\n--- Running Comprehensive M.K. Store Multi-User & Security Test Suite ---');

    let passed = 0;
    let failed = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`[PASS] ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failed++;
        }
    }

    try {
        // 1. Test Products Retrieval (Guests can view everything)
        const prodRes = await mockRequest('GET', '/api/products');
        assert(prodRes.status === 200 && Array.isArray(prodRes.body) && prodRes.body.length >= 35,
            `Guests can freely view products (${prodRes.body?.length} products found)`);

        // 2. Test Guest Order Rejection (Security & User Requirement)
        const guestOrderRes = await mockRequest('POST', '/api/orders', {
            items: [{ _id: 'prod-groc-1', name: 'Premium White Sugar', price: 1.5, quantity: 1 }],
            totalAmount: 1.5,
            shippingDetails: { name: 'Guest', address: 'Unknown' }
        });
        assert(guestOrderRes.status === 401,
            `Guest order attempt is strictly blocked (Status: ${guestOrderRes.status}, Msg: "${guestOrderRes.body?.msg}")`);

        // 3. Test Guest Cart API Rejection
        const guestCartRes = await mockRequest('GET', '/api/cart');
        assert(guestCartRes.status === 401,
            `Guest cart access is strictly blocked (Status: ${guestCartRes.status})`);

        // 4. Test User 1 Registration with Unique UID
        const u1Email = `user1_${Date.now()}@example.com`;
        const reg1Res = await mockRequest('POST', '/api/auth/register', {
            username: 'UserOne',
            email: u1Email,
            password: 'password123'
        });
        assert(reg1Res.status === 200 && reg1Res.body.token && reg1Res.body.user.id,
            `User 1 registered with unique UID: ${reg1Res.body?.user?.id}`);

        const token1 = reg1Res.body.token;
        const user1Id = reg1Res.body.user.id;

        // 5. Test User 1 Cart Dataspace (Save & Fetch)
        const cart1Items = [{ _id: 'prod-groc-1', name: 'Sugar', price: 1.5, quantity: 2 }];
        const saveCart1 = await mockRequest('POST', '/api/cart', { items: cart1Items }, { 'x-auth-token': token1 });
        assert(saveCart1.status === 200 && saveCart1.body.items.length === 1,
            `User 1 cart saved in their private dataspace`);

        // 6. Test User 1 Order Placement
        const order1Res = await mockRequest('POST', '/api/orders', {
            items: cart1Items,
            totalAmount: 3.0,
            shippingDetails: { name: 'User One', address: '123 Street', city: 'Jaipur', zip: '302001', phone: '9998887771' }
        }, { 'x-auth-token': token1 });
        assert(order1Res.status === 200 && order1Res.body._id && order1Res.body.user_id === user1Id,
            `User 1 placed order successfully tied strictly to UID ${user1Id} (Order ID: ${order1Res.body?._id})`);
        const order1Id = order1Res.body._id;

        // 7. Test User 2 Registration with completely separate Unique UID
        const u2Email = `user2_${Date.now()}@example.com`;
        const reg2Res = await mockRequest('POST', '/api/auth/register', {
            username: 'UserTwo',
            email: u2Email,
            password: 'password456'
        });
        assert(reg2Res.status === 200 && reg2Res.body.user.id !== user1Id,
            `User 2 registered with distinct unique UID: ${reg2Res.body?.user?.id}`);

        const token2 = reg2Res.body.token;
        const user2Id = reg2Res.body.user.id;

        // 8. Test User 2 Cart Dataspace Isolation (User 2 should NOT see User 1's cart)
        const getCart2 = await mockRequest('GET', '/api/cart', null, { 'x-auth-token': token2 });
        assert(getCart2.status === 200 && getCart2.body.items.length === 0,
            `User 2 cart is completely isolated from User 1 (0 items in User 2 cart)`);

        // 9. Test User 2 Orders Isolation (User 2 should NOT see User 1's orders)
        const myOrders2 = await mockRequest('GET', '/api/orders/myorders', null, { 'x-auth-token': token2 });
        assert(myOrders2.status === 200 && myOrders2.body.length === 0,
            `User 2 sees 0 orders (User 1's orders are invisible to User 2)`);

        // 10. Test User 2 CANNOT cancel User 1's order (Cross-Tenant Access Denial)
        const unauthorizedCancel = await mockRequest('PUT', `/api/orders/${order1Id}/cancel`, null, { 'x-auth-token': token2 });
        assert(unauthorizedCancel.status === 401 || unauthorizedCancel.status === 403,
            `Cross-user unauthorized order cancellation rejected with status ${unauthorizedCancel.status}`);

        // 11. Test User 1 CAN cancel their own order
        const authorizedCancel = await mockRequest('PUT', `/api/orders/${order1Id}/cancel`, null, { 'x-auth-token': token1 });
        assert(authorizedCancel.status === 200 && authorizedCancel.body.status === 'Cancelled',
            `User 1 can cancel their own order (Status: ${authorizedCancel.body?.status})`);

        // Clean up test data
        await supabase.from('users').delete().eq('id', user1Id);
        await supabase.from('users').delete().eq('id', user2Id);
        await supabase.from('orders').delete().eq('id', order1Id);
        await supabase.from('carts').delete().eq('user_id', user1Id);
        console.log('[CLEANUP] Test users and orders cleaned up successfully.');

    } catch (err) {
        console.error('Test Suite encountered error:', err);
        failed++;
    }

    console.log(`\n--- Test Suite Completed: ${passed} Passed, ${failed} Failed ---`);
    process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
