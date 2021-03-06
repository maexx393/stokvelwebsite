import React, { useEffect, useState } from 'react'

import { FetchGenericChainData } from 'lib/components/FetchGenericChainData'
import { GraphDataQueries } from 'lib/components/queryComponents/GraphDataQueries'
import { readProvider } from 'lib/services/readProvider'
import { calculateEstimatedPoolPrize } from 'lib/utils/calculateEstimatedPoolPrize'
import { getContractAddresses } from 'lib/utils/getContractAddresses'
import { networkNameToChainId } from 'lib/utils/networkNameToChainId'

export const PoolDataContext = React.createContext()

export const PoolDataContextProvider = (props) => {
  const networkName = process.env.NEXT_JS_DEFAULT_ETHEREUM_NETWORK_NAME
  const chainId = networkNameToChainId(networkName)

  const [defaultReadProvider, setDefaultReadProvider] = useState({})

  useEffect(() => {
    const getReadProvider = async () => {
      const defaultReadProvider = await readProvider(networkName)
      setDefaultReadProvider(defaultReadProvider)
    }
    getReadProvider()
  }, [networkName])

  const poolAddresses = getContractAddresses(chainId)

  return <>
    <GraphDataQueries
      {...props}
      poolAddresses={poolAddresses}
    >
      {({
        graphDataLoading,
        dynamicPoolData,
        dynamicPrizeStrategiesData,
      }) => {
        return <FetchGenericChainData
          {...props}
          chainId={chainId}
          provider={defaultReadProvider}
          poolAddresses={poolAddresses}
          poolData={dynamicPoolData}
        >
          {({ genericChainData }) => {
            let pools = []
            
            if (!graphDataLoading) {
              pools = [
                {
                  ...genericChainData.dai,
                  ...dynamicPoolData.daiPool,
                  name: 'DAI Pool',
                  frequency: 'Weekly',
                  symbol: 'PT-cDAI',
                  prizeEstimate: calculateEstimatedPoolPrize({
                    ...genericChainData.dai,
                    ...dynamicPoolData.daiPool,
                    ...dynamicPrizeStrategiesData.daiPrizeStrategy,
                  }),
                },
              ]
            }

            return <PoolDataContext.Provider
              value={{
                loading: graphDataLoading,
                defaultReadProvider,
                pools,
                poolAddresses,
                dynamicPoolData,
                genericChainData,
              }}
            >
              {props.children}
            </PoolDataContext.Provider>
          }}
        </FetchGenericChainData>
      }}
    </GraphDataQueries>
  </>
}
