import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Farmer SaaS API Documentation',
        version: '1.0.0',
        description: 'API documentation for Farmer SaaS application',
        contact: {
          name: 'API Support',
        },
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production' 
            ? 'https://your-production-domain.com' 
            : 'http://localhost:3000',
          description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Auth related endpoints',
        },
        {
          name: 'Weather Advice',
          description: 'Weather forecast and farming advice endpoints',
        },
        {
          name: 'Soil Analysis',
          description: 'Soil health and analysis endpoints',
        },
        {
          name: 'Plant Disease',
          description: 'Plant disease detection endpoints',
        },
        {
          name: 'Commodity Prices',
          description: 'Market prices and trends endpoints',
        },
        {
          name: 'WhatsApp Bot',
          description: 'WhatsApp integration endpoints',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });
  return spec;
}; 