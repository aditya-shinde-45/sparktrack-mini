import React from 'react';
import Loading from '../../Components/Common/loading';

const LoadingTest = () => {
  return (
    <div>
      <Loading message="Loading your data" fullScreen={true} />
    </div>
  );
};

export default LoadingTest;
