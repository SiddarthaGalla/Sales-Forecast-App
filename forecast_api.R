library(plumber)
library(forecast)

# Enable CORS (important for browser requests)
#* @filter cors
function(req, res){
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "*")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  } else {
    plumber::forward()
  }
}

#* @post /forecast
function(req) {
  
  # 🔥 Get uploaded file correctly
  fileinfo <- req$files$dataset
  
  if (is.null(fileinfo)) {
    return(list(error = "No file uploaded"))
  }
  
  # Temporary file path where upload is stored
  filepath <- fileinfo$datapath
  
  # Read CSV from temp file
  data <- read.csv(filepath)
  
  # Ensure Sales column exists
  if (!"Sales" %in% names(data)) {
    return(list(error = "Sales column not found"))
  }
  
  sales <- data$Sales
  
  # Convert to time series
  ts_data <- ts(sales, frequency = 12)
  
  # Train ARIMA model
  model <- auto.arima(ts_data)
  
  # Forecast next 6 periods
  fc <- forecast(model, h = 6)
  
  list(
    forecast = as.numeric(fc$mean),
    accuracy = accuracy(model)[1, "MAPE"]
  )
}

#setwd("S:/HUB/SUB/R Programming/SalesForecastApp")
#library(plumber)
#pr <- plumb("forecast_api.R")
#pr$run(port = 8000)
