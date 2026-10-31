const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const defaultProducts = [
    // Groceries (5)
    { id: "prod-groc-1", name: "Premium White Sugar", price: 1.5, image: "assets/products/sugar.png", category: "Groceries", rating: 4.5 },
    { id: "prod-groc-2", name: "Organic Atta 5kg", price: 2.2, image: "assets/products/atta.png", category: "Groceries", rating: 4.8 },
    { id: "prod-groc-3", name: "Basmati Rice 5kg", price: 7.5, image: "assets/products/rice.png", category: "Groceries", rating: 4.6 },
    { id: "prod-groc-4", name: "Toor Dal 1kg", price: 1.8, image: "assets/products/dal.png", category: "Groceries", rating: 4.4 },
    { id: "prod-groc-5", name: "Sunflower Oil 1L", price: 2.0, image: "assets/products/oil.png", category: "Groceries", rating: 4.5 },

    // Mobiles (5)
    { id: "prod-mob-1", name: "iPhone 14 Pro", price: 999, image: "assets/products/iphone.png", category: "Mobiles", rating: 4.9 },
    { id: "prod-mob-2", name: "Samsung Galaxy S23", price: 899, image: "assets/products/samsung.png", category: "Mobiles", rating: 4.8 },
    { id: "prod-mob-3", name: "Redmi Note 12", price: 299, image: "assets/products/redmi_note_12.png", category: "Mobiles", rating: 4.5 },
    { id: "prod-mob-4", name: "OnePlus 11R", price: 499, image: "assets/products/oneplus.png", category: "Mobiles", rating: 4.7 },
    { id: "prod-mob-5", name: "Nothing Phone (1)", price: 399, image: "assets/products/nothing.png", category: "Mobiles", rating: 4.4 },

    // Fashion (5)
    { id: "prod-fash-1", name: "Men's Casual Shirt", price: 25, image: "assets/products/shirt.png", category: "Fashion", rating: 4.2 },
    { id: "prod-fash-2", name: "Women's Floral Dress", price: 35, image: "assets/products/dress.png", category: "Fashion", rating: 4.6 },
    { id: "prod-fash-3", name: "Running Shoes", price: 45, image: "assets/products/shoes.png", category: "Fashion", rating: 4.4 },
    { id: "prod-fash-4", name: "Classic Blue Jeans", price: 30, image: "assets/products/jeans.png", category: "Fashion", rating: 4.3 },
    { id: "prod-fash-5", name: "Leather Wallet", price: 15, image: "assets/products/wallet.png", category: "Fashion", rating: 4.5 },

    // Electronics (5)
    { id: "prod-elec-1", name: "Wireless Earbuds", price: 49, image: "assets/products/earbuds.png", category: "Electronics", rating: 4.4 },
    { id: "prod-elec-2", name: "Smart Watch", price: 199, image: "assets/products/watch.png", category: "Electronics", rating: 4.6 },
    { id: "prod-elec-3", name: "Laptop Stand", price: 29, image: "assets/products/stand.png", category: "Electronics", rating: 4.5 },
    { id: "prod-elec-4", name: "HD Monitor 24 inch", price: 129, image: "assets/products/monitor.png", category: "Electronics", rating: 4.5 },
    { id: "prod-elec-5", name: "Mechanical Keyboard", price: 79, image: "assets/products/keyboard.png", category: "Electronics", rating: 4.8 },

    // Home (5)
    { id: "prod-home-1", name: "Cotton Bedsheet Set", price: 22, image: "assets/products/bedsheet.png", category: "Home", rating: 4.3 },
    { id: "prod-home-2", name: "Ceramic Flower Vase", price: 15, image: "assets/products/vase.png", category: "Home", rating: 4.7 },
    { id: "prod-home-3", name: "Wall Clock Vintage", price: 18, image: "assets/products/clock.png", category: "Home", rating: 4.2 },
    { id: "prod-home-4", name: "Soft Cushions Set", price: 25, image: "assets/products/cushion.png", category: "Home", rating: 4.5 },
    { id: "prod-home-5", name: "Aroma Diffuser", price: 35, image: "assets/products/diffuser.png", category: "Home", rating: 4.6 },

    // Appliances (5)
    { id: "prod-app-1", name: "Electric Kettle 1.5L", price: 19, image: "assets/products/kettle.png", category: "Appliances", rating: 4.5 },
    { id: "prod-app-2", name: "Sandwich Maker", price: 25, image: "assets/products/sandwich.png", category: "Appliances", rating: 4.3 },
    { id: "prod-app-3", name: "Portable Blender", price: 15, image: "assets/products/blender.png", category: "Appliances", rating: 4.4 },
    { id: "prod-app-4", name: "Air Fryer", price: 85, image: "assets/products/airfryer.png", category: "Appliances", rating: 4.7 },
    { id: "prod-app-5", name: "Coffee Maker", price: 45, image: "assets/products/coffee.png", category: "Appliances", rating: 4.6 },

    // Toys (5)
    { id: "prod-toy-1", name: "Action Figure Hero", price: 12, image: "assets/products/toy_hero.png", category: "Toys", rating: 4.8 },
    { id: "prod-toy-2", name: "Building Blocks Set", price: 20, image: "assets/products/blocks.png", category: "Toys", rating: 4.7 },
    { id: "prod-toy-3", name: "Remote Control Car", price: 35, image: "assets/products/rc_car.png", category: "Toys", rating: 4.6 },
    { id: "prod-toy-4", name: "Plush Teddy Bear", price: 18, image: "assets/products/teddy.png", category: "Toys", rating: 4.5 },
    { id: "prod-toy-5", name: "Classic Puzzle Set", price: 10, image: "assets/products/puzzle.png", category: "Toys", rating: 4.4 }
];

const defaultAdmins = [
    {
        id: "admin-1",
        username: "karankumawat",
        email: "karankumawat303@gmail.com",
        password: "$2b$10$GtNKu3qfxDDMPmDxIjt7N.miPKHr1yBC6KCzL5TJ0BCQEA2WFU8/m", // bcrypt of karan@123
        created_at: new Date().toISOString()
    }
];

const defaultUsers = [
    {
        id: "user-admin-1",
        username: "karankumawat",
        email: "karankumawat303@gmail.com",
        password: "$2b$10$GtNKu3qfxDDMPmDxIjt7N.miPKHr1yBC6KCzL5TJ0BCQEA2WFU8/m",
        role: "admin",
        google_id: null,
        address: "Main Street",
        city: "City Center",
        zip: "302001",
        phone: "+91 9876543210",
        profile_picture: "assets/Logo.png",
        created_at: new Date().toISOString()
    }
];

function initDb() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            products: defaultProducts,
            users: defaultUsers,
            admins: defaultAdmins,
            orders: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error reading local db file, re-initializing:', e);
        const initialData = {
            products: defaultProducts,
            users: defaultUsers,
            admins: defaultAdmins,
            orders: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
}

function saveDb(data) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error('Error writing local db:', e);
    }
}

class LocalQueryBuilder {
    constructor(table) {
        this.table = table;
        this.action = 'select';
        this.selectFields = '*';
        this.filters = [];
        this.orFilters = [];
        this.orderRule = null;
        this.limitCount = null;
        this.isSingle = false;
        this.insertData = null;
        this.updateData = null;
    }

    select(fields = '*') {
        if (!this.action || this.action === 'select') {
            this.action = 'select';
        }
        this.selectFields = fields;
        return this;
    }

    eq(column, value) {
        this.filters.push({ type: 'eq', col: column, val: value });
        return this;
    }

    neq(column, value) {
        this.filters.push({ type: 'neq', col: column, val: value });
        return this;
    }

    or(filterStr) {
        // e.g. "email.eq.foo,username.eq.bar"
        const parts = filterStr.split(',').map(p => p.trim());
        const conds = [];
        for (const part of parts) {
            const match = part.match(/^([a-zA-Z0-9_]+)\.([a-z]+)\.(.*)$/);
            if (match) {
                conds.push({ col: match[1], op: match[2], val: match[3] });
            }
        }
        if (conds.length > 0) {
            this.orFilters.push(conds);
        }
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.orderRule = { col: column, asc: ascending };
        return this;
    }

    limit(n) {
        this.limitCount = n;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    insert(data) {
        this.action = 'insert';
        this.insertData = data;
        return this;
    }

    update(data) {
        this.action = 'update';
        this.updateData = data;
        return this;
    }

    delete() {
        this.action = 'delete';
        return this;
    }

    _filterMatch(item) {
        for (const f of this.filters) {
            if (f.type === 'eq' && item[f.col] != f.val) return false;
            if (f.type === 'neq' && item[f.col] == f.val) return false;
        }
        for (const orConds of this.orFilters) {
            const matchedAny = orConds.some(cond => {
                if (cond.op === 'eq') return item[cond.col] == cond.val;
                if (cond.op === 'neq') return item[cond.col] != cond.val;
                return false;
            });
            if (!matchedAny) return false;
        }
        return true;
    }

    _project(item, fields) {
        if (!item) return null;
        if (!fields || fields === '*') return { ...item };
        const keys = fields.split(',').map(s => s.trim()).filter(Boolean);
        const out = {};
        for (const k of keys) {
            if (item[k] !== undefined) out[k] = item[k];
        }
        return out;
    }

    async execute() {
        const db = initDb();
        if (!db[this.table]) {
            db[this.table] = [];
        }
        const tableData = db[this.table];

        if (this.action === 'insert') {
            const toInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
            const inserted = [];
            for (const item of toInsert) {
                const row = {
                    id: item.id || crypto.randomUUID(),
                    created_at: item.created_at || new Date().toISOString(),
                    ...item
                };
                if (this.table === 'orders' && !row.date) {
                    row.date = new Date().toISOString();
                }
                if (this.table === 'orders' && !row.status) {
                    row.status = 'Processing';
                }
                tableData.push(row);
                inserted.push(row);
            }
            saveDb(db);

            if (this.isSingle) {
                return { data: this._project(inserted[0], this.selectFields), error: null };
            }
            return { data: inserted.map(r => this._project(r, this.selectFields)), error: null };
        }

        if (this.action === 'update') {
            let updatedItem = null;
            for (let i = 0; i < tableData.length; i++) {
                if (this._filterMatch(tableData[i])) {
                    tableData[i] = { ...tableData[i], ...this.updateData };
                    updatedItem = tableData[i];
                }
            }
            saveDb(db);

            if (this.isSingle) {
                if (!updatedItem) return { data: null, error: { message: 'Row not found' } };
                return { data: this._project(updatedItem, this.selectFields), error: null };
            }
            return { data: updatedItem ? [this._project(updatedItem, this.selectFields)] : [], error: null };
        }

        if (this.action === 'delete') {
            const before = tableData.length;
            db[this.table] = tableData.filter(item => !this._filterMatch(item));
            saveDb(db);
            const deletedCount = before - db[this.table].length;
            if (this.isSingle && deletedCount === 0) {
                return { data: null, error: { message: 'Row not found' } };
            }
            return { data: null, error: null };
        }

        // action === 'select'
        let results = tableData.filter(item => this._filterMatch(item));

        if (this.orderRule) {
            const { col, asc } = this.orderRule;
            results.sort((a, b) => {
                const valA = a[col] != null ? a[col] : '';
                const valB = b[col] != null ? b[col] : '';
                if (valA < valB) return asc ? -1 : 1;
                if (valA > valB) return asc ? 1 : -1;
                return 0;
            });
        }

        if (this.limitCount != null) {
            results = results.slice(0, this.limitCount);
        }

        if (this.isSingle) {
            const item = results[0] || null;
            return {
                data: item ? this._project(item, this.selectFields) : null,
                error: item ? null : { message: 'Row not found' }
            };
        }

        return {
            data: results.map(r => this._project(r, this.selectFields)),
            error: null
        };
    }

    then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
    }
}

const localDbClient = {
    from: (table) => new LocalQueryBuilder(table)
};

module.exports = {
    localDbClient,
    initDb
};
