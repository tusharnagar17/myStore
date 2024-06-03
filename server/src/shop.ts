import express, {Request, Response} from "express";
import { Pool } from "pg";
import {drizzle} from "drizzle-orm/node-postgres"
import { products, orders, order_items, SelectOrder } from "./db/schema";
import { eq } from "drizzle-orm";

const router = express.Router()

const pool = new Pool({connectionString: `${process.env.DATABASE_URL}` , ssl: {rejectUnauthorized: false}})
const db = drizzle(pool)

// Error handler for database queries
const handleQueryError = (err: any, res:Response) => {
    console.error("Error executing query: ", err);
    res.status(500).json({ error: 'An error occurred while executing the query.' });
}  

// Get all products
router.get('/products', async (req: Request, res: Response) => {
    try {
        const rows = await db.select().from(products)
        res.status(200).json(rows)
    } catch(err) {
        handleQueryError(err, res)
    }
});

// Get a single product by ID
router.get('/products/:id', async (req: Request, res: Response) => {
    try {
        const {id} = req.params
        const rows = await db.select().from(products).where(eq(products.id, +id))
        res.status(200).json(rows)
    } catch (error) {
        handleQueryError(error, res)
    }
})

router.post('/orders', async (req: Request, res: Response) => {
    try {
        const { email, products: orderBody } = req.body
        const orderRes = await db.transaction(async (trx)=> {
            
            const [newOrder] = await trx.insert(orders).values({customer_email: email}).returning()
            // return product prices
            const productPrices = await Promise.all(
                orderBody.map(async (item:any) => {
                    const [res] = await trx.select().from(products).where(eq(products.id, +item.product_id))
                    return res.product_price
                })
            )
            
            // setting order in order_items list
            const orderList = await Promise.all(
                orderBody.map(async (item:any, index: number) => {
                    const totalCal = (+productPrices[index] * +item.quantity).toFixed(2);
                    const [tempRes] = await trx.insert(order_items).values({
                        order_id: newOrder.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        total: +totalCal,
                    }).returning()
                    return tempRes
                })
            )

            const totalPrice = orderList.reduce((acc: number, curr: SelectOrder)=> {
                return acc + curr.total 
            }, 0)

            const [updateOrder] = await trx
                .update(orders)
                .set({total: totalPrice.toFixed(2)})
                .where(eq(orders.id, newOrder.id))
                .returning()
            return {...updateOrder, products: orderList}
        })
        res.status(200).json(orderRes)
    } catch (error) {
        handleQueryError(error, res)
    }        
})
export default router