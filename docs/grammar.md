# CSON Grammar
What is meant by `name` and `captures`
https://discuss.atom.io/t/grammar-understanding-captures-vs-name/14783

Generally the best docs:
http://manual.macromates.com/en/language_grammars.html

# Dynamic Grammar
We used dynamic (code driven) grammar initially. Following are the lessons still worth sharing but we are using the CSON grammar now.

I am using `atom` and `first-mate` interchangeably here. There isn't a documented way of creating a grammar from *code*. We found a hacky way by reading a *lot of source code*. Please look at `typeScriptGrammar.ts`. Basically you inherit from `Grammar` and let that do the heavy lifting. Then all you need is to return `AtomTokens` from `tokenizeLine`. The way the atom grammar works is that they will store the returned `ruleSet` for any line and call `tokenizeLine` for the next line passing in that `ruleSet`. As soon as you edit a line all the following lines are invalidated and  `tokenizeLine` is called for them again. This works beautifully with the `ts.createClassifier` which is a quick syntactic classifier provided by the TS language service. It only depends on a `finalLexState` (e.g. did the previous line have a continuing multiline comment) and that is what we store in the `ruleSet`.

**Warnings**:
* Atom is stingy about you calling its `createToken` in the *right order* so don't just call it unless you have the classification at exactly the right time.
* Atom doesn't want you to classify the BOM. It will give it to you as a part of the string, its up to you to carefully ignore it and don't call `createToken` for it.
* Do not mutate the `ruleSet` that is passed into you. Its for the previous line. Create your own `ruleSet` for your line!
* Also see [#159](https://github.com/TypeStrong/atom-typescript/issues/159) to see how editor settings (still using regex copied from language-javascript) + forcefully tokenizing empty lines plays with autoindent.


