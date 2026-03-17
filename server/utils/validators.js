
export const isValidGitHubUrl = (url) => {
  const githubRegex = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+$/;
  return githubRegex.test(url);
};


export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};


export const isValidPassword = (password) => {
  
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

