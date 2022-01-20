function (user, context, callback) {
  user.app_metadata = user.app_metadata || {};
  if (!("isNew" in user.app_metadata)) {
    user.app_metadata.isNew = true;
    auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
        .then(function(){
          callback(null, user, context);
        })
        .catch(function(err){
          callback(err);
        });
  }
  else {
    callback(null, user, context);
  }
}