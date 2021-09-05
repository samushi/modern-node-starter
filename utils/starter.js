const Helpers = require('./helpers');
const chalk = require("chalk");
const { exec } = require("child_process");
const editJsonFile = require("edit-json-file");
const { createWriteStream, readdir } = require("fs");
const { writeFile } = require("gitignore");
const inquirer = require("inquirer");
const { ncp } = require("ncp");
const ora = require("ora");
const path = require("path");
const { promisify } = require("util");

const readDir = promisify(readdir);
const asyncExec = promisify(exec);
const writeGitignore = promisify(writeFile);

module.exports = class Starter {

    spinner = null;
    dirname = null;

    constructor(){
        const projectName = Helpers.getPath(process.argv[2]);
        this.dirname = Helpers.getLibDir();
        this.start(projectName);
    }

    /**
     * Start CLI
     * @param {*} projectName 
     */
    async start(projectName){
        try{

            this.spinner = ora();
            const template = await this.chooseTemplates();


            const { isUpdated, isDeduped } = await this.setupModuleManagement();

            console.log("[ 1 / 3 ] 🔍  copying project...");
            console.log("[ 2 / 3 ] 🚚  fetching node_modules...");

            await this.copyProjectFiles(projectName, template);
            await this.updatePackageJson(projectName);

            console.log("[ 3 / 3 ] 🔗  linking node_modules...");
            console.log(
            "\u001b[2m──────────────────────────────────────────\u001b[22m"
            );

            this.spinner.start();

            // manage node_modules
            await this.installNodeModules(projectName);
            isUpdated && (await this.updateNodeModules(projectName));
            isDeduped && (await this.dedupeNodeModules(projectName));

            await this.postInstallScripts(projectName, template);

            // set gitignore
            await this.createGitignore(projectName);
            await this.initGit(projectName);

            await this.succeedConsole(template);

        }catch(error){
            await this.failConsole(error);
        }
    }
    
    /**
     * @method getDirectories
     * @description Get the templates directory.
     */
    async getTemplateDir(){
        const contents = await readDir(this.dirname, { withFileTypes: true });
        const directories = contents
            .filter((p) => p.isDirectory())
            .map((p) => p.name);

        return directories;
    }

    /**
     * @method chooseTemplates
     * @description Choose a template.
     */
    async chooseTemplates() {
        let templateChoosed;
        const directories = await this.getTemplateDir();

        if(directories.length === 0){
            throw new Error("We dont have any repository");
        }
        
        // Get first repository
        templateChoosed = directories[0];

        // if have more then one repository make choosable
        if(directories.length > 1){
          const { chooseTemplates } = await inquirer.prompt([
              {
                  type: "list",
                  name: "chooseTemplates",
                  message: "Please select the template you want",
                  choices: [...directories, new inquirer.Separator()],
              },
          ]);
          
          templateChoosed = chooseTemplates;
        }
    
        return templateChoosed;
    }

    /**
     * @method setupModuleManagement
     * @description Set up npm management features.
     */
    async setupModuleManagement(){
        const { isUpdated } = await inquirer.prompt([
        {
            type: "confirm",
            name: "isUpdated",
            message:
            "This command will update all the packages listed to the latest version.",
        },
        ]);
    
        const { isDeduped } = await inquirer.prompt([
        {
            type: "confirm",
            name: "isDeduped",
            message: "It is used to clean up duplicate packages in npm.",
        },
        ]);
    
        return { isUpdated, isDeduped };
    }

    /**
     * @method copyProjectFiles
     * @description Duplicate the template.
     */
    async copyProjectFiles(destination, directory){
        return new Promise((resolve, reject) => {
            const source = path.join(this.dirname, `./${directory}`);
            const options = {
                clobber: true,
                stopOnErr: true,
            };
        
            ncp.limit = 16;
            ncp(source, destination, options, function (err) {
                if (err) reject(err);
                resolve();
            });
        });
    }

    /**
     * @method updatePackageJson
     * @description Edit package.json.
     */
    async updatePackageJson(destination){
        const file = editJsonFile(`${destination}/package.json`, { autosave: true });
    
        file.set("name", path.basename(destination));
    }

    /**
     * @method installNodeModules
     * @description Install node modules.
     */
    async installNodeModules(destination){
        this.spinner.text = "Install node_modules...\n";
        await asyncExec("npm install --legacy-peer-deps", { cwd: destination });
    }

    /**
     * @method updateNodeModules
     * @description Update node modules.
     */
    async updateNodeModules(destination){
        this.spinner.text = "Update node_modules...\n";
        await asyncExec("npm update --legacy-peer-deps", { cwd: destination });
    };
  
  /**
   * @method dedupeNodeModules
   * @description Dedupe node modules.
   */
  async dedupeNodeModules(destination){
    this.spinner.text = "Dedupe node_modules...\n";
    await asyncExec("npm dedupe --legacy-peer-deps", { cwd: destination });
  };
  
  /**
   * @method postInstallScripts
   * @description After installation, configure the settings according to the template.
   */
  async postInstallScripts(destination, template){
    switch (template) {
      case "prisma":
        {
          this.spinner.text = "Run prisma generate...";
          await asyncExec("npm run prisma:generate", { cwd: destination });
        }
        break;
    }
  };
  
  /**
   * @method createGitignore
   * @description Create a .gitignore.
   */
  async createGitignore(destination){
    this.spinner.text = "Create .gitignore...";
  
    const file = createWriteStream(path.join(destination, ".gitignore"), {
      flags: "a",
    });
  
    return writeGitignore({
      type: "Node",
      file: file,
    });
  };
  
  /**
   * @method initGit
   * @description Initialize git settings.
   */
  async initGit(destination){
    await asyncExec("git init", { cwd: destination });
  };
  
  /**
   * @method succeedConsole
   * @description When the project is successful, the console is displayed.
   */
  async succeedConsole(template){
    await this.spinner.succeed(chalk`{green Complete setup project}`);
  }
  
  /**
   * @method failConsole
   * @description When the project is fail, the console is displayed.
   */
  async failConsole(error){
    await this.spinner.fail(chalk`{red ${error}}`);
  }
}