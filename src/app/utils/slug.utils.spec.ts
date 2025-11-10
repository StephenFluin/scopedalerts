import { generateSlug, isValidSlug, SLUG_PATTERN } from './slug.utils';

/**
 * Simple tests for slug utilities
 * These would typically be run with a proper test framework like Jest
 */

// Test generateSlug function
console.log('Testing generateSlug:');
console.log(generateSlug('My Product Name!'), '// Expected: my-product-name');
console.log(generateSlug('  Test-Product  '), '// Expected: test-product');
console.log(
  generateSlug('Angular Components & Modules'),
  '// Expected: angular-components-modules'
);
console.log(generateSlug('123 Test @#$ Product'), '// Expected: 123-test-product');
console.log(generateSlug(''), '// Expected: (empty string)');

console.log('\nTesting isValidSlug:');
console.log(isValidSlug('my-product-name'), '// Expected: true');
console.log(isValidSlug('my-product-123'), '// Expected: true');
console.log(isValidSlug('my_product_name'), '// Expected: false (underscores not allowed)');
console.log(isValidSlug('My-Product-Name'), '// Expected: false (uppercase not allowed)');
console.log(isValidSlug('my-product!'), '// Expected: false (special chars not allowed)');
console.log(isValidSlug(''), '// Expected: false (empty string not valid)');

console.log('\nTesting SLUG_PATTERN:');
console.log(SLUG_PATTERN.test('valid-slug-123'), '// Expected: true');
console.log(SLUG_PATTERN.test('invalid-slug!'), '// Expected: false');

export {};
