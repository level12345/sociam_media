import { useState, useEffect } from "react";

import Backdrop from "../../Backdrop/Backdrop";
import Modal from "../../Modal/Modal";
import Input from "../../Form/Input/Input";
import FilePicker from "../../Form/Input/FilePicker";
import Image from "../../Image/Image";
import { required, length } from "../../../util/validators";
import { generateBase64FromImage } from "../../../util/image";

const POST_FORM = {
  title: {
    value: "",
    valid: false,
    touched: false,
    validators: [required, length({ min: 5 })],
  },
  image: {
    value: "",
    valid: false,
    touched: false,
    validators: [required],
  },
  content: {
    value: "",
    valid: false,
    touched: false,
    validators: [required, length({ min: 5 })],
  },
};

function FeedEdit({
  editing,
  selectedPost,
  loading,
  onCancelEdit,
  onFinishEdit,
}) {
  const [postForm, setPostForm] = useState(POST_FORM);
  const [imagePreview, setImagePreview] = useState(null);

  // Derived during render, not stored
  let formIsValid = true;
  for (const inputName in postForm) {
    formIsValid = formIsValid && postForm[inputName].valid;
  }

  // Pre-fill the form when a post is selected for editing
  useEffect(() => {
    if (editing && selectedPost) {
      setPostForm({
        title: { ...POST_FORM.title, value: selectedPost.title, valid: true },
        image: {
          ...POST_FORM.image,
          value: selectedPost.imagePath,
          valid: true,
        },
        content: {
          ...POST_FORM.content,
          value: selectedPost.content,
          valid: true,
        },
      });
    }
  }, [editing, selectedPost]);

  const postInputChangeHandler = (input, value, files) => {
    if (files) {
      generateBase64FromImage(files[0])
        .then((b64) => setImagePreview(b64))
        .catch(() => setImagePreview(null));
    }
    setPostForm((prev) => {
      let isValid = true;
      for (const validator of prev[input].validators) {
        isValid = isValid && validator(value);
      }
      return {
        ...prev,
        [input]: {
          ...prev[input],
          valid: isValid,
          value: files ? files[0] : value,
        },
      };
    });
  };

  const inputBlurHandler = (input) => {
    setPostForm((prev) => ({
      ...prev,
      [input]: { ...prev[input], touched: true },
    }));
  };

  const cancelPostChangeHandler = () => {
    setPostForm(POST_FORM);
    onCancelEdit();
  };

  const acceptPostChangeHandler = () => {
    const post = {
      title: postForm.title.value,
      image: postForm.image.value,
      content: postForm.content.value,
    };
    onFinishEdit(post);
    setPostForm(POST_FORM);
    setImagePreview(null);
  };

  return editing ? (
    <>
      <Backdrop onClick={cancelPostChangeHandler} />
      <Modal
        title="New Post"
        acceptEnabled={formIsValid}
        onCancelModal={cancelPostChangeHandler}
        onAcceptModal={acceptPostChangeHandler}
        isLoading={loading}
      >
        <form>
          <Input
            id="title"
            label="Title"
            control="input"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler("title")}
            valid={postForm.title.valid}
            touched={postForm.title.touched}
            value={postForm.title.value}
          />
          <FilePicker
            id="image"
            label="Image"
            control="input"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler("image")}
            valid={postForm.image.valid}
            touched={postForm.image.touched}
          />
          <div className="new-post__preview-image">
            {!imagePreview && <p>Please choose an image.</p>}
            {imagePreview && <Image imageUrl={imagePreview} contain left />}
          </div>
          <Input
            id="content"
            label="Content"
            control="textarea"
            rows="5"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler("content")}
            valid={postForm.content.valid}
            touched={postForm.content.touched}
            value={postForm.content.value}
          />
        </form>
      </Modal>
    </>
  ) : null;
}

export default FeedEdit;
