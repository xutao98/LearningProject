/*
 * @Author: <xutao>
 * @Date: 2025-01-10 22:02:36
 * Promise/A+规范实现
 * Promise/A+规范：https://promisesaplus.com/
 * 
 */
class XPromise {
    constructor(executor){
        this.init()
        try{
            executor(this.resolve.bind(this), this.reject.bind(this))
        }catch(e){
            this.reject(e)
        }
    }
    init(){
        this.state = 'pending'
        this.value = undefined
        this.reason = undefined
        this.fulfilledCallbacks = []
        this.rejectedCallbacks = []
    }
    resolve(value){
        if(this.state !== 'pending')  return
        if(value === this) throw new TypeError('Chaining cycle detected for promise')
        if(value instanceof XPromise){
            value.then(this.resolve.bind(this), this.reject.bind(this))
            return
        }

        this.state = 'fulfilled'
        this.value = value
        this.fulfilledCallbacks.forEach(cb => cb(value))
    }
    reject(reason){
        if(this.state !== 'pending')  return

        this.state ='rejected'
        this.reason = reason
        
        this.rejectedCallbacks.forEach(cb => cb(reason))
    }
    then(onFulfilled, onRejected){
        onFulfilled = typeof onFulfilled === 'function'? onFulfilled : val => val
        onRejected = typeof onRejected === 'function'? onRejected : val => val

        return new XPromise((resolve, reject) => {
            const cbHandler = (cb, val) => {
                setTimeout(() => {
                    try{
                        const cbResult = cb(val)
                        if(cbResult instanceof XPromise){
                            cbResult.then(resolve, reject)
                        }else{
                            resolve(cbResult)
                        }
                    }catch(e){
                        reject(e)
                    }
                }, 0)
            }
            switch(this.state){
                case 'fulfilled':
                    cbHandler(onFulfilled, this.value)
                    break
                case'rejected':
                    cbHandler(onRejected, this.reason)
                    break
                case 'pending':
                    this.fulfilledCallbacks.push(val=>cbHandler(onFulfilled, this.value))
                    this.rejectedCallbacks.push(val=>cbHandler(onRejected, this.reason))
                    break
            }
        })
        
    }
    catch(onRejected){
        return this.then(null, onRejected)
    }
    static all(promises){
        return new XPromise((resolve, reject) => {
            const result = []
            let count = 0
            promises.forEach((promise, index) => {
                XPromise.resolve(promise).then(value => {
                    result[index] = value
                    count++
                    if(count === promises.length){
                        resolve(result)
                    }
                }, reject)
            })
        })
    }
    static race(promises){
        return new XPromise((resolve, reject) => {
            promises.forEach(promise => {
                XPromise.resolve(promise).then(resolve, reject)
            })
        })
    }
    static resolve(value){
        if(value instanceof XPromise){
            return value
        }
        return new XPromise(resolve => resolve(value))
    }
    static reject(reason){
        return new XPromise((resolve, reject) => reject(reason))
    }
}
const p = new XPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('hello')
    }, 1000)
})
p.then(res => {
    console.log(res)
    return new XPromise((resolve, reject) => {
        setTimeout(() => {
            reject('error')
        }, 1000)
    })
}).then(res => {
    console.log(res)
},err=>{
    console.log('error:')
    console.log(err)
    return new XPromise((resolve, reject) => {
        setTimeout(() => {
            resolve('error hanlded')
        }, 1000)
    })
}).then(res => {
    console.log(res)
    return new XPromise((resolve, reject) => { 
        reject('world')
    })
}).catch(err => {
    console.log('error:')
    console.log(err)
})
console.log('end')