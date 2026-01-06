# Inventory Management System

A full-stack inventory and order management system built with React, TypeScript, Tailwind CSS, and MySQL. This application provides comprehensive inventory tracking, order management, profit/loss reporting, and return processing capabilities.

## Features

- **Product Management**: Create, update, and delete products with detailed attributes
- **Order Processing**: Full order lifecycle management
- **Inventory Tracking**: Real-time stock level monitoring with movement history
- **Profit & Loss Reporting**: Financial tracking and reporting
- **Return Processing**: Complete return and refund management
- **QR Code Generation**: Product identification and tracking
- **Store Credits**: Discount code management for customer credits
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL with Drizzle ORM
- **Build Tools**: Vite, esbuild
- **Styling**: Tailwind CSS with custom components
- **State Management**: TanStack Query (React Query)

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MySQL** (v8 or higher)
- **Git**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up MySQL Database

#### Option A: Using MySQL Command Line

1. Start your MySQL server
2. Create a new database:
```sql
CREATE DATABASE fabrix;
```

3. Create a MySQL user with appropriate permissions:
```sql
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'fabrix2026!';
GRANT ALL PRIVILEGES ON fabrix.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Option B: Using MySQL Workbench or phpMyAdmin

1. Open your MySQL management tool
2. Create a new database named `fabrix`
3. Create a new user with full permissions to the `fabrix` database

### 4. Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL=mysql://inventory_user:your_password@localhost:3306/fabrix
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

**Note**: For Gmail, you'll need to use an App Password instead of your regular password. Enable 2-factor authentication and generate an App Password.

### 5. Database Schema Setup

The application uses Drizzle ORM to manage database schemas. After setting up your MySQL database, run:

```bash
npm run db:push
```

This will create all necessary tables based on the schema defined in `shared/schema.mysql.ts`.

### 6. Run the Application

#### Development Mode

```bash
npm run dev
```

The application will start in development mode with hot reloading. The server will be available at `http://localhost:5000`.

#### Production Mode

First, build the application:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

## Database Configuration Details

### MySQL Connection

The application connects to MySQL using the following parameters from your `.env` file:
- Host: localhost (default) or your MySQL server address
- Port: 3306 (default MySQL port)
- Database: fabrix (or your chosen database name)
- Username and password from your `.env` file

### Schema Structure

The application uses the following main tables:

1. **products**: Product inventory with attributes like name, SKU, category, price, stock quantity, etc.
2. **orders**: Customer orders with status, total amount, customer information
3. **order_items**: Individual items within orders
4. **stock_movements**: History of all stock changes (inbound/outbound)
5. **stock_stats**: Aggregated stock statistics per product
6. **returns**: Product return records
7. **return_items**: Individual items within returns
8. **discount_codes**: Store credit and promotional codes
9. **accounts**: Profit & Loss accounting records
10. **profit_loss_config**: Configuration for indirect expenses/income

### Migrations

Database migrations are handled by Drizzle Kit and stored in the `migrations/` directory. You can generate new migrations with:

```bash
npx drizzle-kit generate
```

And apply them with:

```bash
npx drizzle-kit migrate
```

## API Endpoints

The application provides a comprehensive REST API:

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a specific product
- `POST /api/products` - Create a new product
- `PATCH /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get a specific order
- `POST /api/orders` - Create a new order
- `PATCH /api/orders/:id` - Update an order

### Stock Management
- `GET /api/stock-movements` - Get stock movement history
- `POST /api/stock-movements` - Create a stock movement
- `GET /api/stock-movements/low-stock` - Get low stock products

### Returns
- `GET /api/returns` - Get all returns
- `POST /api/returns` - Create a return
- `GET /api/returns/:id` - Get a specific return

### Discount Codes
- `GET /api/discount-codes` - Get discount codes
- `POST /api/discount-codes/:code/use` - Use a discount code

### Financial Reports
- `GET /api/accounts` - Get profit/loss data
- `GET /api/profit-loss-config` - Get financial configuration

## File Upload Configuration

The application supports image uploads for products. All images are stored as base64 data URLs in the database:

- Maximum file size: 5MB per image
- Supported formats: All standard image formats (JPEG, PNG, GIF, etc.)
- Upload endpoints:
  - `/api/upload/image` - Single image upload
  - `/api/upload/images` - Multiple image upload (up to 5 images)

## QR Code Generation

The application includes QR code generation for product identification:

- `POST /api/qr-code/generate` - Generate QR code
- `GET /api/qr-code/:data` - Get QR code as image

## Email Configuration

The application can send email notifications for store credits. Configure your SMTP settings in the `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

## Development

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utility functions
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   └── storage.ts         # Database operations
├── shared/                 # Shared schema definitions
├── migrations/            # Database migrations
└── ...
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push schema to database

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure MySQL server is running
   - Verify credentials in `.env` file
   - Check that the database exists

2. **Build Errors**:
   - Ensure Node.js version is 18 or higher
   - Run `npm install` to install dependencies
   - Check for TypeScript compilation errors

3. **Port Already in Use**:
   - Change the PORT in `.env` file
   - Kill processes using the port: `lsof -ti:5000 | xargs kill -9`

### Database Sync

The application was previously designed with dual database support (MySQL and SQLite) but now uses a single MySQL database. The sync service is configured but currently disabled as per the `sync-service.ts` file.

## Security Considerations

- Never commit your `.env` file to version control
- Use strong passwords for database users
- If deploying to production, ensure HTTPS is enabled
- Validate and sanitize all user inputs
- Regularly update dependencies

## Deployment

For production deployment:

1. Set up your production MySQL database
2. Configure environment variables appropriately
3. Build the application: `npm run build`
4. Start the server: `npm run start`

## Support

For support, please create an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License.