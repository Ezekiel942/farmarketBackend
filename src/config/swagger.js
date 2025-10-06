const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Farmarket API',
      version: '1.0.0',
      description: 'API for Farmarket (users, auth, categories, products)',
      contact: { name: 'Charles Ugberaese', email: 'ugberaeseac@gmail.com' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development Server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },

  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/models/*.js'] 
};

const swaggerSpec = swaggerJSDoc(options);


module.exports = swaggerSpec;
