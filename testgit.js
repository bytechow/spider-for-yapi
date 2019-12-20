var getRepoInfo = require('git-repo-info');
 
var info = getRepoInfo();

console.log('info ==>', info)