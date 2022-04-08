const { Octokit } = require("@octokit/core")
const github = require('@actions/github')
const core = require('@actions/core');
const base64 = require('base-64')
const axios = require('axios')
const githubToken = core.getInput('github-token')
const branch = core.getInput('branch')
const newVersion = core.getInput('new-version')
const octokit = new Octokit({ auth: githubToken})

async function run(){
    if(githubToken){
        try{
            let content = await getContent()
            let {sha} = content.data
            let {download_url} = content.data
            if (download_url){
                let {data} = await getContentFile(download_url)
                modifyVersionAndUploadFile(data, sha)
            }
        }catch(error){
            core.setFailed('The branch or file does not exist!')
        }
    }else{
        core.setFailed('The github-token parameter is required!')
    }
}

function modifyVersionAndUploadFile(data, sha){
    if (data && data != ''){
        if(modifyVersion(data) && modifyVersion(data) != ''){
            let newFile = modifyVersion(data)
            let fileBase64 = base64.encode(JSON.stringify(newFile))
            uploadGithub(fileBase64, 'package.json', sha)
        }else{
            core.setFailed('Failed to update package.json version!')
        }
    }else{
        core.setFailed('Failed to read file!')
    }
}

function getContent(){
    let param = {
        owner: github.context.payload.repository.owner.name,
        repo: github.context.payload.repository.name,
        path: 'package.json',
    }
    if (branch && branch != ''){
        param['ref'] = branch 
    }
    return  octokit.request('GET /repos/{owner}/{repo}/contents/{path}', param, (response)=>{
        if (response.status  == 200){
            return response
        }

        return false
    })
}

async function getContentFile (raw_url){
    
    return axios.get(raw_url, {
        headers: {
            Authorization: `Bearer ${githubToken}`
        }
    })
}

function modifyVersion (package_json_obj){
    if(newVersion == '' || newVersion == undefined){
        core.setFailed('A new version is required!')
        return false
    }
    package_json_obj.version = newVersion
    return package_json_obj
}

async function uploadGithub(content, fileName, sha){
    let param = {
        owner: github.context.payload.repository.owner.name,
        repo: github.context.payload.repository.name,
        path: 'package.json',
        message: `ci: Update ${fileName}`,
        content: content,
        sha: sha
    }
    
    uploadFileBase64(param, fileName)
}

async function uploadFileBase64(param, fileName){
    if (branch && branch != ''){
        delete param.ref
        param['branch'] = branch 
    }
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', param).then(()=>{
        
        let message = `Arquivo ${fileName} atualizado`
        console.log({
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': {
                'message': message,
            }
        })
        core.setOutput("success", message)
        
    }).catch(function(error){
        core.setFailed("Error ao commitar file: ",error)
    })
}

run()