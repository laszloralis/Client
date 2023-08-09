
import {Channel} from "./channels.js";


//=========================================================
//  PostStorage class
//=========================================================
class PostStorage{
    static CHANNEL_NAME = 'Posts';
    static ID_LIST_NAME = 'Post.id'
    static #posts = [];
    static #transaction_posts = [];
    static #transaction_last_legth = [];
    static #id_set = new Set();



    static storePost(post, closeTransaction=true){
        console.log('PostStorage.storePost, id: ', post.id);

        PostStorage.#transaction_posts.push(post);
        if (closeTransaction)
            PostStorage.closeTransaction();
    }

    static deletePost(id, closeTransaction=true){
        console.log('PostStorage.deletePosts, id: ', id);

        if (PostStorage.#id_set.has(id)){
            const idx = PostStorage.#posts.findIndex(item => item.id === id);
            PostStorage.#posts.splice(idx, 1);
            if (closeTransaction)
                PostStorage.closeTransaction();
        }
    }
  
    static getPost(id){
        const post = PostStorage.#posts.find(item => item.id === id);
        return post;
    }

    
    static closeTransaction(){
        //console.log('PostStorage.closeTransaction PostStorage.#posts.length, lastLength, transaction: ', PostStorage.#posts.length, PostStorage.#transaction_last_legth, PostStorage.#transaction_posts );
        //store function for map
        function store(post){
            // is the post new?
            if (!PostStorage.#id_set.has(post.id)){
                // yes, store it
                PostStorage.#id_set.add(post.id);
                // store the id as key and next index as value
                PostStorage.#posts.push(post);
            } else {
                // no, update it
                const idx = PostStorage.#posts.findIndex(item => item.id === post.id);
                PostStorage.#posts[idx] = post;
                // send notification
                Channel.notify(PostStorage.CHANNEL_NAME, post.id, post);
            }    
        }

        // add / update every post with the store function
        PostStorage.#transaction_posts.map(store);

        //length was changed since last closed transaction? (items were added or deleted)
        if (PostStorage.#posts.length !== PostStorage.#transaction_last_legth){
            let ids = [];
            PostStorage.#posts.map((post) => ids.push(post.id) );
            // send notification
            Channel.notify(PostStorage.CHANNEL_NAME, PostStorage.ID_LIST_NAME, ids);
            //update length for the next transaction
            PostStorage.#transaction_last_legth = PostStorage.#posts.length;
        }

        //clear the transaction buffer
        PostStorage.#transaction_posts = [];
    }
    
  }
  
  export default PostStorage;