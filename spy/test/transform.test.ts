import { describe, it } from 'mocha'
import { transformer } from '../transform/cjs'
import { expect } from 'chai'

const getSpyHame = (name: string) => '__spy_' + name
const sourceIdentifier = 'source-id'
const importStr = `var _spyProxy = require("@cycler/spy").spy;`

const cleanText = (s: string) =>
  s.replace(/\n\s*/g, '\n').replace(/\s*\n/g, '\n') //.replace(/\n+/g, '\n')
const compare = (transformed: string, expected: string) => {
  expect(cleanText(transformed)).to.equal(cleanText(expected))
}

const spyFn = '_spyProxy'

describe('[Cycle Spy] file CJS transform', () => {
  it('skips commented @spy', () => {
    const source = `"use strict";
      /* // @spy */
      const one = this.object
        
      something // // @spy-this        
    `
    const expected = `"use strict";
    /* // @spy */
    const one = this.object
      
    something // // @spy-this        
  `
    const transformed = transformer(source, {
      sourceIdentifier,
      resourcePath: '/path/to/file.js',
    })
    compare(transformed, expected)
  })
  it('handles base cases', () => {
    const source = `"use strict";
  
      // @spy-this
      const one = this.object
        .done()
  
      // @spy-this
      const oneFn = () => {
  
      }
    `
    const expected = `"use strict";
  ${importStr}
  
      // @spy-this
      const ${getSpyHame('one')} = this.object
        .done()
  
      const one = _spyProxy(__spy_one, "one", {"source": "/path/to/file.js"});
  
      // @spy-this
      const ${getSpyHame('oneFn')} = () => {
  
      }
      const oneFn = _spyProxy(__spy_oneFn, "oneFn", {"source": "/path/to/file.js"});
    `
    const transformed = transformer(source, {
      sourceIdentifier,
      resourcePath: '/path/to/file.js',
    })
    compare(transformed, expected)
  })

  it('handles inline case @spy in the end of line ', () => {
    const source = `"use strict";
  
      merge(
        something.DOM,   // @spy
      )
      
    `
    const expected = `"use strict";
  ${importStr}
  
      merge(
        _spyProxy(something.DOM, "something.DOM", {}), // @spy
      )

    `
    const transformed = transformer(source, {
      sourceIdentifier,
      //resourcePath: '/path/to/file.js',
    })
    compare(transformed, expected)
  })

  it('handles key/value case ', () => {
    const source = `"use strict";
  
      merge(
        someKey$: something.DOM,   // @spy
        // @spy
        [otherKey]: something.DOM,
      )
      
    `
    const expected = `"use strict";
  ${importStr}
  
      merge(
        someKey$: _spyProxy(something.DOM, "something.DOM", {}), // @spy
        // @spy
        [otherKey]: _spyProxy(something.DOM, "something.DOM", {}),
      )

    `
    const transformed = transformer(source, {
      sourceIdentifier,
      //resourcePath: '/path/to/file.js',
    })
    compare(transformed, expected)
  })

  it('handles last line case', () => {
    const source = `
      // @spy-this
      const one = this.object
        .done()
  
    `
    const expected = `
  ${importStr}
      // @spy-this
      const ${getSpyHame('one')} = this.object
        .done()
  
      const one = ${spyFn}(__spy_one, "one", {});
    `
    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })

  it('handles export declaration', () => {
    const source = `
  // @spy-this
  export const two = () => {
  
  }
    `
    const expected = `
  ${importStr}
  // @spy-this
  const ${getSpyHame('two')} = () => {
  
  }
  export const two = _spyProxy(${getSpyHame('two')}, "two", {});
    `

    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })

  it('transforms just identifer', () => {
    const source = `
    merge(
      // @spy
      one.DOM,
      two
    `
    const expected = `
  ${importStr}
    merge(
      // @spy
      ${spyFn}(one.DOM, "one.DOM", {}),
      two
    `
    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })

  it('transforms with return statement', () => {
    const source = `
    return some.DOM // @spy

    // @spy
    return some.DOM

    `
    const expected = `
  ${importStr}          
    return ${spyFn}(some.DOM, "some.DOM", {}) // @spy

    // @spy
    return ${spyFn}(some.DOM, "some.DOM", {})
    `

    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })

  it('CJS transform start-end block', () => {
    const source = `
    merge(
    // @spy-this-start spyThisBlock {myOpt: "xx"}
    some
      .deep()
      .map()
      // @spy-this-end
    
    two
    `
    const expected = `
  ${importStr}
    merge(
    // @spy-this-start spyThisBlock {myOpt: "xx"}
    ${spyFn}(
    some
      .deep()
      .map()
      , "spyThisBlock", {myOpt: "xx"})
      // @spy-this-end
    
    two
    `
    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })

  it('CJS transform chain', () => {
    const source = `
    merge(    
      xs
      .map(), // @spy-chain one
      .fold() // @spy fold
    `
    const expected = `
  ${importStr}
    merge(    
      xs
      .map().compose(_ => ${spyFn}(_, "one", {})), // @spy-chain one
      .fold().compose(_ => ${spyFn}(_, "fold", {})) // @spy fold
    `
    const transformed = transformer(source, { sourceIdentifier })
    compare(transformed, expected)
  })
})
