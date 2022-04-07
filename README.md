
# set-tag-npm
### Description
This action changes the package.json file version of the specified branch, 
if no branch is specified it will change the default branch file
### Example
```yml
uses: archaic10/set-tag-npm@main
with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    new-version: '2.0.0'
```

### Or
```yml
uses: archaic10/set-tag-npm@main
with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    new-version: '2.0.0'
    branch: development
```