/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The user's unique identifier
 *         fullName:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         phone:
 *           type: string
 *           description: The user's phone number
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: When the user last logged in
 *     
 *     DiseaseReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the disease report
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who submitted the report
 *         cropName:
 *           type: string
 *           description: Name of the affected crop
 *         diseaseDetected:
 *           type: string
 *           description: Name of the detected disease
 *         region:
 *           type: string
 *           description: Geographic region where the disease was observed
 *         severity:
 *           type: string
 *           description: Severity level of the disease
 *         diagnosisDate:
 *           type: string
 *           format: date-time
 *           description: When the diagnosis was made
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the report was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the report was last updated
 *     
 *     SoilHealthReport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the soil health report
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who submitted the report
 *         ph:
 *           type: number
 *           format: float
 *           description: Soil pH value
 *         nitrogen:
 *           type: number
 *           format: float
 *           description: Nitrogen content in soil (ppm)
 *         phosphorus:
 *           type: number
 *           format: float
 *           description: Phosphorus content in soil (ppm)
 *         potassium:
 *           type: number
 *           format: float
 *           description: Potassium content in soil (ppm)
 *         organicMatter:
 *           type: number
 *           format: float
 *           description: Organic matter percentage in soil
 *         region:
 *           type: string
 *           description: Geographic region where soil was sampled
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: When the report was submitted
 *     
 *     WeatherQuery:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the weather query
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who made the query
 *         location:
 *           type: string
 *           description: Location for weather data
 *         crop:
 *           type: string
 *           description: Crop for which weather advice is requested
 *         gptAdvice:
 *           type: string
 *           description: AI-generated advice based on weather data
 *         queriedAt:
 *           type: string
 *           format: date-time
 *           description: When the query was made
 *     
 *     CommodityQuery:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the commodity query
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who made the query
 *         cropName:
 *           type: string
 *           description: Name of the crop for price data
 *         region:
 *           type: string
 *           description: Market region for price data
 *         dateRange:
 *           type: string
 *           description: Date range for price data
 *         queriedAt:
 *           type: string
 *           format: date-time
 *           description: When the query was made
 *     
 *     GptAlert:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the alert
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user to whom the alert is addressed
 *         title:
 *           type: string
 *           description: Alert title
 *         summary:
 *           type: string
 *           description: Alert content summary
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the alert was created
 */ 