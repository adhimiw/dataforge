use clap::{Parser, Subcommand, ValueEnum};
use dataforge_rs::analysis::profile_csv;
use dataforge_rs::governance::{authorize, policy_report, Action, AutonomyBudget};
use dataforge_rs::live::collect_live;
use dataforge_rs::raster::rasterize_png;
use dataforge_rs::tui;
use dataforge_rs::workspace::{research_brief, Workspace};
use dataforge_rs::{Result, PRODUCT};
use serde_json::json;
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "dataforge-rs",
    about = "Governed DataForge terminal application written in Rust"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Workspace {
        #[command(subcommand)]
        command: WorkspaceCommand,
    },
    Analyze {
        input: PathBuf,
        #[arg(long, default_value = "unknown")]
        classification: String,
        #[arg(long, default_value = ".")]
        workspace: PathBuf,
    },
    Rasterize {
        image: PathBuf,
        #[arg(long, default_value = ".")]
        workspace: PathBuf,
        #[arg(long, default_value = "figure")]
        id: String,
        #[arg(long, default_value = "Python plot")]
        title: String,
        #[arg(long, default_value_t = 64)]
        width: u32,
        #[arg(long, default_value_t = 18)]
        height: u32,
    },
    Dashboard {
        #[arg(long, default_value = ".")]
        workspace: PathBuf,
    },
    Live {
        #[command(subcommand)]
        command: LiveCommand,
    },
    Guard {
        action: ActionName,
        #[arg(long)]
        bypass: bool,
    },
}

#[derive(Subcommand)]
enum WorkspaceCommand {
    Init {
        #[arg(default_value = ".")]
        directory: PathBuf,
    },
    Doctor {
        #[arg(default_value = ".")]
        directory: PathBuf,
    },
    ResearchBrief {
        #[arg(default_value = ".")]
        directory: PathBuf,
    },
    Autonomy {
        #[arg(default_value = ".")]
        directory: PathBuf,
    },
}

#[derive(Subcommand)]
enum LiveCommand {
    Fetch {
        #[arg(long, default_value = ".")]
        workspace: PathBuf,
        #[arg(
            long,
            help = "explicitly approve fetching the documented public sources"
        )]
        approved: bool,
    },
}

#[derive(Clone, ValueEnum)]
enum ActionName {
    LocalInspect,
    AggregateProfile,
    LocalArtifact,
    Verify,
    ExternalResearch,
    ExternalDownloadOrJoin,
    CredentialUse,
    DataMutation,
    DestructiveOperation,
    DatabaseWrite,
    ModelTrainingOrLabelGeneration,
    Publication,
    OutOfWorkspaceAccess,
}

impl From<ActionName> for Action {
    fn from(value: ActionName) -> Self {
        match value {
            ActionName::LocalInspect => Self::LocalInspect,
            ActionName::AggregateProfile => Self::AggregateProfile,
            ActionName::LocalArtifact => Self::LocalArtifact,
            ActionName::Verify => Self::Verify,
            ActionName::ExternalResearch => Self::ExternalResearch,
            ActionName::ExternalDownloadOrJoin => Self::ExternalDownloadOrJoin,
            ActionName::CredentialUse => Self::CredentialUse,
            ActionName::DataMutation => Self::DataMutation,
            ActionName::DestructiveOperation => Self::DestructiveOperation,
            ActionName::DatabaseWrite => Self::DatabaseWrite,
            ActionName::ModelTrainingOrLabelGeneration => Self::ModelTrainingOrLabelGeneration,
            ActionName::Publication => Self::Publication,
            ActionName::OutOfWorkspaceAccess => Self::OutOfWorkspaceAccess,
        }
    }
}

#[tokio::main]
async fn main() {
    if let Err(error) = run(Cli::parse()).await {
        eprintln!("{PRODUCT} error: {error}");
        std::process::exit(1);
    }
}

async fn run(cli: Cli) -> Result<()> {
    match cli.command {
        Command::Workspace { command } => match command {
            WorkspaceCommand::Init { directory } => {
                let workspace = Workspace::new(directory);
                println!("{} workspace ready: {}", PRODUCT, workspace.root.display());
                for item in workspace.initialize()? {
                    println!("{item}");
                }
            }
            WorkspaceCommand::Doctor { directory } => println!(
                "{}",
                serde_json::to_string_pretty(&Workspace::new(directory).doctor())?
            ),
            WorkspaceCommand::ResearchBrief { directory } => println!(
                "{}",
                serde_json::to_string_pretty(&research_brief(&directory))?
            ),
            WorkspaceCommand::Autonomy { directory } => println!(
                "{}",
                serde_json::to_string_pretty(
                    &json!({"product": PRODUCT, "workspace": directory, "policy": policy_report()})
                )?
            ),
        },
        Command::Analyze {
            input,
            classification,
            workspace,
        } => {
            let workspace = Workspace::new(workspace);
            workspace.initialize()?;
            let report = profile_csv(&input, &workspace, &classification)?;
            println!("{}", serde_json::to_string_pretty(&report)?);
        }
        Command::Rasterize {
            image,
            workspace,
            id,
            title,
            width,
            height,
        } => {
            let workspace = Workspace::new(workspace);
            workspace.initialize()?;
            rasterize_png(
                &image,
                &workspace.manifest_path(),
                &id,
                &title,
                width,
                height,
            )?;
            println!(
                "Wrote local terminal raster to {}",
                workspace.manifest_path().display()
            );
        }
        Command::Dashboard { workspace } => tui::run(&Workspace::new(workspace).manifest_path())?,
        Command::Live { command } => match command {
            LiveCommand::Fetch {
                workspace,
                approved,
            } => {
                if !approved {
                    return Err(dataforge_rs::DataForgeError::Governance(
                        "Public live-data collection is an external action. Re-run with --approved after reviewing the source contract.".to_string(),
                    ));
                }
                let run = collect_live(&Workspace::new(workspace)).await?;
                println!("{}", serde_json::to_string_pretty(&run)?);
            }
        },
        Command::Guard { action, bypass } => println!(
            "{}",
            serde_json::to_string_pretty(&authorize(
                action.into(),
                bypass,
                &AutonomyBudget::default()
            ))?
        ),
    }
    Ok(())
}
