See the [Atom contributing guide](https://atom.io/docs/latest/contributing)

# Building 
`grunt build`

# Developing
`grunt`

# Publishing
`apm publish`


# General research
## Getting the language service
Opening up the TypeScript compiler : http://www.slideshare.net/nnzz2475/typescript-35845723 
```bash
git glone https://git01.codeplex.com/typescript TypeScript
cd TypeScript
npm install 
node_modules/.bin/jake/local
cd built/local
ls
```
Important:
```bash
typescriptServices.d.ts
typescriptServices.js
```