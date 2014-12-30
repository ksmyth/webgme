/**
 * Created by tkecskes on 12/11/2014.
 */
define([ "util/assert", "core/core", "core/tasync" ], function(ASSERT, Core, TASYNC) {
  "use strict";

  // ----------------- CoreTreeLoader -----------------

  var MetaCore = function (innerCore) {
    var core = {},
      key;
    for ( key in innerCore) {
      core[key] = innerCore[key];
    }

    //adding load functions
    core.loadSubTree = function(root){
      var loadSubTrees = function(nodes){
        for (var i = 0; i < nodes.length; i++) {
          nodes[i] = core.loadSubTree(nodes[i]);
        }
        return TASYNC.lift(nodes);

      };
      return TASYNC.call(function(children){
        if(children.length<1){
          return [root];
        } else {
          return TASYNC.call(function(subArrays){
            var nodes = [],
              i;
            for(i=0;i<subArrays.length;i++){
              nodes = nodes.concat(subArrays[i]);
            }
            nodes.unshift(root);
            return nodes;
          },loadSubTrees(children));
        }
      },core.loadChildren(root));
    };
    core.loadTree = function(rootHash) {
      return TASYNC.call(core.loadSubTree, core.loadRoot(rootHash));
    };

    return core;
  };
  return MetaCore;
});
