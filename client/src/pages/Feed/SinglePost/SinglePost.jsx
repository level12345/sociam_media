import { useEffect, useState } from "react";
import { useParams } from "react-router";
import Image from "../../../components/Image/Image";
import "./SinglePost.css";

function SinglePost({ token }) {
  const [postData, setPostData] = useState({
    title: "",
    author: "",
    date: "",
    image: "",
    content: "",
  });

  const { postId } = useParams();

  useEffect(() => {
    const URL = `${import.meta.env.VITE_API_URL}/feed/post/${postId}`;
    console.log(`Hitting this route: ${URL}`);

    fetch(URL, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Failed to fetch post");
        }
        return res.json();
      })
      .then((resData) => {
        setPostData({
          title: resData.post.title,
          author: resData.post.creator.name,
          image: resData.post.imageUrl,
          date: new Date(resData.post.createdAt).toLocaleDateString("en-US"),
          content: resData.post.content,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }, [postId, token]);

  return (
    <section className="single-post">
      <h1>{postData.title}</h1>
      <h2>
        Created by {postData.author} on {postData.date}
      </h2>
      <div className="single-post__image">
        <Image contain imageUrl={postData.image} />
      </div>
      <p>{postData.content}</p>
    </section>
  );
}

export default SinglePost;
