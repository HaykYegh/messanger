// When Building versions for release for windows machines we have to manually go to node_modules/auto-lunch/package.json
and change the "winreg" dependency from its usual version to "https://github.com/Slapbox/node-winreg/tarball/master" and run "npm install" in that folder.
This repository contains the fix to winreg dependency not getting application path on Windows machines.


------ UPDATES FOR MAC OS ------

step 1: install aws cli on your computer.

1.1: follow the aws documentation instructions to finish this part.

    https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

1.2: Once you have aws cli installed on your machine, ask the aws-console admin(Aram Hovsepyan) to provide you
with the public key and private key for aws-console so that you can have access for publishing updates through aws sdk

1.3: When you get the public key and private key for aws-console, open Terminal on your computer and run this command

`nano ~/.aws/credentials`. 

Type the following lines into the file.

    [default]
    aws_access_key_id={your new public key}
    aws_secret_access_key={your new secret key}
    
Make sure there are no extra empty lines between them and curly brackets are not needed, just paste the keys after the = symbol.
When you are done editing the file press Control+o, press enter to save the file and then Control+x to exit the file.

1.4: Open Terminal and run the following command: 

`nano ~/.aws/config`

Type the following lines into the file.

    [default]
    region={your aws updates bucket region. example: eu-west-1}

Make sure there are no extra empty lines between them and curly brackets are not needed, just paste the keys after the = symbol.
When you are done editing the file press Control+o, press enter to save the file and then Control+x to exit the file.

step 2: go to app/config.json file, find the exact config matching your app prefix (for example: zz, jt), and go to the S3 object,
update the accessKeyId and secretAccessKey with the same keys we added in the aws credentials file in step 1.3. if the bucket region is not
matching to the same as in the aws config file from step 1.4 then update that too.

step 3: got to package.json and look for the build configs, compare the s3 settings in the "publish" section and make sure that the
aws bucket name bucket path and the bucket region are all matching.

step 4: Code Signing your app

if you already have the p12 combined certificate ready to use then skip the step 4.1.

4.1: first we have to create the p12 combined certificate for signing our app. 
For this purpose follow the instructions in the following link

    `https://habr.com/ru/post/455874/`
    
and create the p12 file, then store it somewhere for later access.   

4.2: Open the terminal from your IDE in this case it is the WebStorm terminal, 
and run the following commands.

    export CSC_LINK={absolute path to your p12 file from step 4.1}
    export CSC_KEY_PASSWORD={set a password}

curly brackets obviously are not needed

step 5: updating app version 

we have the version of our app stored in two places, first one is in the config.json file,
and the other one is in the app/package.json file, so whenever there is a new version to publish
we go to the config json file, find the matching prefix configs and update the BUILD_VERSION to the new version,
then we go to the app/package.json file and change the version in there too, make sure you put the same version in both files

step 6: building, packaging and publishing the new version of app

6.1: open terminal in your IDE and run the following command

        npm run build

6.2: once the build process is done without errors run the following command for packaging

        npm run package

this will create all the necessary packages for your mac application, you can find the results of this command
in the release folder, during this step it will also go through notarization of your application, we had the 
steps for preparing app for notarization in step 4, if there are no issues or errors logging in the terminal
about notarization of the application then it was successful. 

once it is ready go to the release folder and get the dmg file, install it on some other
mac device to test if the computer lets you run the applications without any warning
if the mac os throws warnings before running the app this means the notarisation has not been done.

here is another link for the notarisation process, if there are any issues with this step.

        https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/                 

6.3: once the packaging of the application is done run the following command in the terminal

        npm run publish
        
this will upload the files from the dmg zip and blockmap files to aws bucket.
If there are any issues on this step there is likely problems with one of the following
1. aws bucket name or bucket path
2. aws bucket region
3. aws cli files, which are the credentials and config files from step 1
4. you might have access issues with the aws bucket. contact aws admin to resolve this issue.

6.4: go to your aws console s3 bucket and verify that the files have been uploaded to the bucket.
If they are missing it means you did something wrong in step 6.3. 

step 7: adding the new version info to the release notes.

7.1: for this step go to the corresponding application console for example: console.zangi.com for Zangi desktop app.
7.2: go to the Settings page from the left menu bar
7.3: select the App Releases section from the top part of the table
7.4: press the Add Release button and follow the instructions, select the platform to be Desktop
     and put the same version for the app that we did in the config json file and app/package.json file.
     Once you are done with it, press Create and it will create a new release note
7.5: click on the 3 dots in the right most side of the newly added release note with your version from the table.
     From here you will be provided with a couple of options you can add a note for your release which will later indicate
     what changes have been pushed through this update.
7.6: click the same 3 dots and select publish from the popup in order to publish the release note, this will notify the
     back end that a new version is available. so when the user logs in into the desktop app and goes to the update section
     they will see that there is a new version of the app to install.
                
------ THE END ------                      
