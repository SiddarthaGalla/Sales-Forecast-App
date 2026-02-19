FROM rstudio/plumber

WORKDIR /app
COPY . /app

RUN R -e "install.packages('plumber', repos='https://cloud.r-project.org')"

EXPOSE 8000

CMD ["Rscript", "-e", "pr <- plumber::plumb('forecast_api.R'); pr$run(host='0.0.0.0', port=8000)"]
