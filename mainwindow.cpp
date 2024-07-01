#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonValue>
#include <QProcess>
#include "logstatus.h"
#include "aboutdialog.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    this->setFixedSize(this->width(), this->height());
    // Disable the maximize button
    this->setWindowFlags(Qt::Window | Qt::WindowMinimizeButtonHint | Qt::WindowCloseButtonHint);

    // Check for ffmpeg
    if (QFile::exists(qApp->applicationDirPath() + "/bin/ffmpeg")) {
        ui->ffmpeg_status->setText("Found");
    } else {
        ui->ffmpeg_status->setText("Not Found");
    }

    // Check for obs
    if (QFile::exists(qApp->applicationDirPath() + "/bin/obs")) {
        ui->obs_status->setText("Found");
    } else {
        ui->obs_status->setText("Not Found");
    }


    // Check for nodejs
    if (QFile::exists(qApp->applicationDirPath() + "/bin/node")) {
        ui->nodejs_status->setText("Found");
    } else {
        ui->nodejs_status->setText("Not Found");
    }


    // Check for NDI Runtime
    // This is a simple placeholder check. You may need a more robust way to check if NDI Runtime is installed.
    if (QFile::exists("C:/Program Files/NDI/NDI 6 Runtime/v6")) {
        ui->ndi_status->setText("Installed");
    } else {
        ui->ndi_status->setText("Not Installed");
    }

    // Read the JSON configuration file
    QFile file(qApp->applicationDirPath() + "/config.json");
    if (file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        QByteArray jsonData = file.readAll();
        file.close();

        QJsonDocument doc(QJsonDocument::fromJson(jsonData));
        if (!doc.isNull() && doc.isObject()) {
            QJsonObject obj = doc.object();

            ui->dc_token->setText(obj["token"].toString());
            ui->dc_server->setText(obj["serverId"].toString());
            ui->dc_voice->setText(obj["channelID"].toString());

            ui->statusbar->showMessage("Configuration loaded successfully.");
        } else {
            ui->statusbar->showMessage("Invalid JSON format in config.json.");
        }
    } else {
        ui->statusbar->showMessage("Failed to open config.json.");
    }

    // Connect signals to slots to handle text changes
    connect(ui->dc_token, &QLineEdit::textChanged, this, &MainWindow::saveConfig);
    connect(ui->dc_server, &QLineEdit::textChanged, this, &MainWindow::saveConfig);
    connect(ui->dc_voice, &QLineEdit::textChanged, this, &MainWindow::saveConfig);
}

void MainWindow::saveConfig()
{
    QJsonObject obj;
    obj["token"] = ui->dc_token->text();
    obj["serverId"] = ui->dc_server->text();
    obj["channelID"] = ui->dc_voice->text();

    QJsonDocument doc(obj);

    QFile file(qApp->applicationDirPath() + "/config.json");
    if (file.open(QIODevice::WriteOnly | QIODevice::Text)) {
        file.write(doc.toJson());
        file.close();
        ui->statusbar->showMessage("Configuration saved successfully.");
    } else {
        ui->statusbar->showMessage("Failed to save config.json.");
    }
}
MainWindow::~MainWindow()
{
    delete ui;
}
void MainWindow::on_startBtn_clicked()
{
    // Update button text
    ui->startBtn->setText("Starting");

    // Update status bar
    ui->statusbar->showMessage("Starting processes...");

    // Start node.exe process
    QString nodePath = qApp->applicationDirPath() + "/bin/node/node.exe";
    if (QFile::exists(nodePath)) {
        QProcess *nodeProcess = new QProcess(this);
        QStringList nodeArgs;
        nodeArgs << qApp->applicationDirPath() + "/dist/index.js";
        nodeProcess->start(nodePath, nodeArgs);

        connect(nodeProcess, &QProcess::started, [=]() {
            ui->statusbar->showMessage("node.exe process started.");
        });

        connect(nodeProcess, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
                [=](int exitCode, QProcess::ExitStatus exitStatus){
                    ui->statusbar->showMessage(QString("node.exe process finished with exit code %1").arg(exitCode));
                });
    } else {
        ui->statusbar->showMessage("Node.js executable not found at: " + nodePath);
    }

    QString obsPath = qApp->applicationDirPath() + "/bin/obs/bin/64bit/";
    QString obsExec = "obs64.exe";
    QString obsFullPath = obsPath + obsExec;

    if (QFile::exists(obsFullPath)) {
        QProcess *obsProcess = new QProcess(this);

        qDebug() << "Starting OBS at:" << obsFullPath;

        // Set the working directory before starting the process
        obsProcess->setWorkingDirectory(obsPath);

        // Prepare arguments
        QStringList obsArgs;
        obsArgs << "--portable" << "--disable-shutdown-check" << "--disable-missing-files-check" << "--startrecording";

        obsProcess->start(obsFullPath, obsArgs);

        connect(obsProcess, &QProcess::started, [=]() {
            ui->statusbar->showMessage("obs64.exe process started.");
        });

        connect(obsProcess, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
                [=](int exitCode, QProcess::ExitStatus exitStatus){
                    ui->statusbar->showMessage(QString("obs64.exe process finished with exit code %1").arg(exitCode));
                });
    } else {
        ui->statusbar->showMessage("OBS executable not found at: " + obsFullPath);
    }

}




void MainWindow::on_pushButton_clicked()
{
    // // Instantiate and open your logstatus dialog or widget
    LogStatus logDialog(this);
    logDialog.exec(); // Use exec() for modal dialog or show() for modeless
}


void MainWindow::on_actionAbout_triggered()
{
    AboutDialog aboutDialog(this);
    aboutDialog.exec();
}


void MainWindow::on_actionExit_triggered()
{
    this->close();
}


void MainWindow::on_clrBtn_clicked()
{
    QJsonObject obj;
    obj["token"] = "";
    obj["serverId"] = "";
    obj["channelID"] = "";

    QJsonDocument doc(obj);

    QFile file(qApp->applicationDirPath() + "/config.json");
    if (file.open(QIODevice::WriteOnly | QIODevice::Text)) {
        file.write(doc.toJson());
        file.close();
        ui->statusbar->showMessage("Configuration cleared successfully.");
    } else {
        ui->statusbar->showMessage("Failed to clear config.json.");
    }

    // Clear UI text fields
    ui->dc_token->setText("");
    ui->dc_server->setText("");
    ui->dc_voice->setText("");
}

