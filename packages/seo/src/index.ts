/**
 * @superior-ai/seo
 *
 * Declared as a dependency of @superior-ai/marketing but nothing in the repo
 * currently imports anything from it, and packages/marketing/src has no
 * source files at all (its main field pointed at a nonexistent index.ts too
 * — see packages/marketing/src/index.ts). Left as a real-but-empty package
 * so the workspace graph resolves; build out once marketing/src has actual
 * consumers to design against.
 */
export {};
