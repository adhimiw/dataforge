import { afterEach, describe, expect, it } from "bun:test"
import { applyBrandDefaults, BRAND } from "@/branding"

const originalRuntime = process.env.DATAFORGE_RUNTIME
const originalSwitch = process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH

afterEach(() => {
  if (originalRuntime === undefined) delete process.env.DATAFORGE_RUNTIME
  else process.env.DATAFORGE_RUNTIME = originalRuntime
  if (originalSwitch === undefined) delete process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH
  else process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH = originalSwitch
})

describe("DataForge runtime defaults", () => {
  it("does not mutate library configuration outside the DataForge executable", () => {
    delete process.env.DATAFORGE_RUNTIME
    const config = applyBrandDefaults({})
    expect(config).toEqual({})
  })

  it("selects Big Pickle and installs workflow commands at runtime", () => {
    process.env.DATAFORGE_RUNTIME = "1"
    delete process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH
    const config = applyBrandDefaults({})

    expect(config.model).toBe(BRAND.model)
    expect(config.small_model).toBe(BRAND.model)
    expect(config.default_agent).toBe("dataforge")
    expect(config.enabled_providers).toEqual([BRAND.providerID])
    expect(config.provider?.[BRAND.providerID]?.name).toBe(BRAND.providerLabel)
    expect(config.provider?.[BRAND.providerID]?.whitelist).toEqual([BRAND.modelID])
    expect(config.command?.init?.agent).toBe("dataforge")
    expect(config.command?.debug?.description).toContain("Diagnose")
    expect(config.command?.research?.agent).toBe("dataforge")
    expect(config.command?.research?.template).toContain("approval")
    expect(config.command?.research?.template).toContain("never include raw values")
    expect(config.command?.enrich?.agent).toBe("dataforge")
    expect(config.command?.enrich?.template).toContain("reversible")
    expect(config.command?.analyze?.template).toContain("analysis-console manifest")
    expect(config.command?.autonomous?.agent).toBe("dataforge")
    expect(config.command?.autonomous?.template).toContain("budget")
    expect(config.command?.autonomous?.template).toContain("Do not attempt to bypass permissions")
  })

  it("preserves an explicit model and allows provider switching by opt-in", () => {
    process.env.DATAFORGE_RUNTIME = "1"
    process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH = "1"
    const config = applyBrandDefaults({ model: "openai/gpt-5" })

    expect(config.model).toBe("openai/gpt-5")
    expect(config.enabled_providers).toBeUndefined()
    expect(config.provider).toBeUndefined()
    expect(config.default_agent).toBe("dataforge")
  })
})
