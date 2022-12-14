import { Component } from 'react';
import PropTypes from 'prop-types';

import { ImageGalleryItem } from 'components/ImageGalleryItem/ImageGalleryItem';
import { fetchImages } from 'services/images-api';
import Modal from 'components/Modal/Modal';
import { GalleryContainer } from './ImageGallery.styled';
import { Button } from 'components/Button/Button';
import { Loader } from 'components/Loader/Loader';
import { NothingFound } from 'components/NothingFound/NothingFound';

export default class ImageGallery extends Component {
  state = {
    images: [],
    status: 'idle',
    error: '',
    loader: false,
    package_length: null,
    showModal: false,
    modalImg: null,
  };

  toggleModal = () => {
    this.setState(({ showModal }) => ({
      showModal: !showModal,
    }));
  };

  onImgClick = id => {
    const clickedImg = this.state.images.find(image => image.id === id);
    this.setState({ modalImg: clickedImg });
    this.toggleModal();
  };

  scroll = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  componentDidUpdate(prevProps, _) {
    const prevQuery = prevProps.query;
    const currentQuery = this.props.query;

    const prevPage = prevProps.page;
    const currentPage = this.props.page;

    if (prevQuery !== currentQuery || prevPage < currentPage) {
      // this.setState({ status: 'pending' });
      this.setState({ loader: true });

      fetchImages(currentQuery, currentPage)
        .then(images => {
          // console.log(images);

          // For new query
          if (prevQuery !== currentQuery) {
            this.setState({
              images: images.hits,
              loader: false,
              status: 'resolved',
              package_length: images.hits.length,
            });
          }

          // For addition query
          if (prevQuery === currentQuery) {
            this.setState(prevState => ({
              status: 'resolved',
              loader: false,
              images: [...prevState.images, ...images.hits],
              package_length: images.hits.length,
            }));
          }
        })
        .catch(error => this.setState({ error, status: 'rejected' }))
        .finally(() => {
          // console.log('scroll');
          // console.log(document.documentElement.scrollHeight);
          // this.scroll();
          setTimeout(() => {
            this.scroll();
          }, 300);
        });
    }
  }

  render() {
    const {
      images,
      status,
      error,
      package_length,
      loader,
      showModal,
      modalImg,
    } = this.state;
    const { query, pageIncrement } = this.props;

    if (status === 'idle') {
      return <div>{loader && <Loader />}</div>;
    }
    if (status === 'rejected') {
      return <p>{error.message}</p>;
    }
    // if (status === 'pending') {
    //   return <p>??????????????????...</p>;
    // }
    if (status === 'resolved') {
      return (
        <div>
          {images.length > 0 ? (
            <GalleryContainer>
              {images.map(({ id, webformatURL, tags }) => (
                <ImageGalleryItem
                  key={id}
                  id={id}
                  url={webformatURL}
                  title={tags}
                  onImgClick={this.onImgClick}
                />
              ))}
            </GalleryContainer>
          ) : (
            <NothingFound query={query} />
          )}
          {loader && <Loader />}
          {showModal && (
            <Modal onClose={this.toggleModal}>
              <img src={modalImg.largeImageURL} alt={modalImg.tags} />
            </Modal>
          )}
          {package_length >= 12 && !loader && (
            <Button onClick={pageIncrement} />
          )}
        </div>
      );
    }
  }
}

ImageGallery.propTypes = {
  page: PropTypes.number.isRequired,
  query: PropTypes.string.isRequired,
  pageIncrement: PropTypes.func.isRequired,
};
