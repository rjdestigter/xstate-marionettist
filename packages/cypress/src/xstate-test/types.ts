import { EventObject, State, StateNode } from 'xstate';
export interface TestMeta<T, TContext> {
  test?: (testContext: T, state: State<TContext, any>) => unknown;
  description?: string | ((state: State<TContext, any>) => string);
  skip?: boolean;
}
interface TestSegment<T> {
  state: State<any, any>;
  event: EventObject;
  description: string;
  test: (testContext: T) => unknown;
  exec: (testContext: T) => unknown;
}
interface TestStateResult {
  error: null | Error;
}
export interface TestSegmentResult {
  segment: TestSegment<any>;
  state: TestStateResult;
  event: {
    error: null | Error;
  };
}
export interface TestPath<T> {
  weight: number;
  segments: Array<TestSegment<T>>;
  description: string;
  /**
   * Tests and executes each segment in `segments` sequentially, and then
   * tests the postcondition that the `state` is reached.
   */
  test: (testContext: T) => TestPathResult | Promise<TestPathResult>;
}
export interface TestPathResult {
  segments: TestSegmentResult[];
  state: TestStateResult;
}

/**
 * A collection of `paths` used to verify that the SUT reaches
 * the target `state`.
 */
export interface TestPlan<TTestContext, TContext> {
  /**
   * The target state.
   */
  state: State<TContext, any>;
  /**
   * The paths that reach the target `state`.
   */
  paths: Array<TestPath<TTestContext>>;
  /**
   * The description of the target `state` to be reached.
   */
  description: string;
  /**
   * Tests the postcondition that the `state` is reached.
   *
   * This should be tested after navigating any path in `paths`.
   */
  test: (
    /**
     * The test context used for verifying the SUT.
     */
    testContext: TTestContext
  ) => unknown;
}

/**
 * A sample event object payload (_without_ the `type` property).
 *
 * @example
 *
 * ```js
 * {
 *   value: 'testValue',
 *   other: 'something',
 *   id: 42
 * }
 * ```
 */
interface EventCase {
  type?: never;
  [prop: string]: any;
}

export type StatePredicate<TContext> = (state: State<TContext, any>) => boolean;
/**
 * Executes an effect using the `testContext` and `event`
 * that triggers the represented `event`.
 */
export type EventExecutor<T> = (
  /**
   * The testing context used to execute the effect
   */
  testContext: T,
  /**
   * The represented event that will be triggered when executed
   */
  event: EventObject
) => unknown;

export interface TestEventConfig<TTestContext> {
  /**
   * Executes an effect that triggers the represented event.
   *
   * @example
   *
   * ```js
   * exec: async (page, event) => {
   *   await page.type('.foo', event.value);
   * }
   * ```
   */
  exec?: EventExecutor<TTestContext>;
  /**
   * Sample event object payloads _without_ the `type` property.
   *
   * @example
   *
   * ```js
   * cases: [
   *   { value: 'foo' },
   *   { value: '' }
   * ]
   * ```
   */
  cases?: EventCase[];
}

export interface TestEventsConfig<T> {
  [eventType: string]: EventExecutor<T> | TestEventConfig<T>;
}
export interface TestModelOptions<T> {
  events: TestEventsConfig<T>;
}
export interface TestModelCoverage {
  stateNodes: Map<string, number>;
  transitions: Map<string, Map<EventObject, number>>;
}

export interface CoverageOptions<TContext> {
  filter?: (stateNode: StateNode<TContext, any, any>) => boolean;
}
