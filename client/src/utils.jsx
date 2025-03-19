import { rnorm } from 'probability-distributions';

/**
 * Samples a number from a normal distribution with a provided mean and standard deviation.
 * @param {number} mean - The mean of the normal distribution.
 * @param {number} stdDev - The standard deviation of the normal distribution.
 * @returns {number} - A random number sampled from the normal distribution.
 */
export const sampleNormalDistribution = (mean, stdDev) => {
  return rnorm(1, mean, stdDev)[0];
};


/**
 * Samples a number from a uniform distribution with provided lower and upper bounds.
 * @param {number} lower - The lower bound of the uniform distribution.
 * @param {number} upper - The upper bound of the uniform distribution.
 * @returns {number} - A random number sampled from the uniform distribution.
 */
export const sampleUniformDistribution = (lower, upper) => {
    return runif(1, lower, upper)[0];
  };