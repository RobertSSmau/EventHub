// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

// 🔧 Risolvi path assoluto (compatibile con ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventHub API',
      version: '1.0.0',
      description:
        'API documentation for EventHub backend ',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger docs available at http://localhost:3000/api/docs');
}
