#include "logstatus.h"
#include "ui_logstatus.h"

LogStatus::LogStatus(QWidget *parent)
    : QDialog(parent)
    , ui(new Ui::LogStatus)
{
    ui->setupUi(this);
    // Initialize the logTextEdit if needed here (optional)
}

LogStatus::~LogStatus()
{
    delete ui;
}

void LogStatus::appendLog(const QString &message)
{
    ui->logTextEdit->append(message);
}
