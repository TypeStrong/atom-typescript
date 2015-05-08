Somewhat regularly-built snapshots of [Microsoft/TypeScript](https://github.com/Microsoft/TypeScript)

This is meant to be used as pre-release builds if you want to try the compiler / compiler API out but don't care to build it yourself. Note that this is a personal endeavor, not officially by Microsoft.


### Install

``` sh
npm install https://github.com/Arnavion/typescript-github/tarball/<release name>
```

or in your package.json

```javascript
    "dependencies": {
        "typescript": "https://github.com/Arnavion/typescript-github/tarball/<release name>"
    }
```

Each release is named after the day it was built and the git commit hash in Microsoft/TypeScript/master that it was built from.


### Build

Each commit is built using the following commands:

```sh
set -e

# Official Microsoft/TypeScript clone
typeScriptDirectory='/stuff/src/typescript'

# Arnavion/typescript-github clone
typeScriptGithubDirectory='/stuff/src/typescript-github'

cd $typeScriptDirectory

git clean -xfd
git fetch origin
git reset --hard origin/master

commitHash=`git rev-parse HEAD`

# Install jake
npm install jake

# Build once with LKG
./node_modules/.bin/jake release tsc --trace
cp ./built/local/* ./bin/

# Rebuild with itself
./node_modules/.bin/jake release clean local --trace

# Copy output
cp ./built/local/* ./bin/tsc ./bin/tsserver $typeScriptGithubDirectory/bin/

# Manual verification here
# ...

# Commit and push
cd $typeScriptGithubDirectory
< package.json > package.json.new sed -E "s/(\s+\"version\": \")[^\"]+(\",)/\10.$(date +%Y%m%d).0+$commitHash\2/"
mv package.json.new package.json
git add -A

commitName="$(date +%Y-%m-%d)-$commitHash"
git commit -m $commitName
git tag $commitName
git push
git push --tags
```


### License

APL 2.0

All copyright belongs to Microsoft.
