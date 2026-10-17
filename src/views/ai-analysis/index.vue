<template>
  <div
    class="professional-analysis-page qd-workspace-page"
    :class="{ 'theme-dark': isDarkTheme, embedded }"
    :style="{ '--primary-color': primaryColor }"
  >
    <CopilotWorkbench />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import CopilotWorkbench from './components/CopilotWorkbench.vue'

export default {
  name: 'ProfessionalAnalysisPage',
  components: { CopilotWorkbench },
  props: {
    embedded: { type: Boolean, default: false }
  },
  computed: {
    ...mapState({
      navTheme: state => state.app.theme,
      primaryColor: state => state.app.color || 'var(--primary-color, #1890ff)'
    }),
    isDarkTheme () {
      return this.navTheme === 'dark' || this.navTheme === 'realdark'
    }
  }
}
</script>

<style scoped>
.professional-analysis-page {
  box-sizing: border-box;
  width: 100%;
  height: calc(100vh - 88px);
  min-height: 560px;
  padding: 12px 12px 14px;
  overflow: hidden;
  background: transparent;
  font-family: var(--qd-font-ui);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
}

.professional-analysis-page.embedded {
  height: calc(100vh - 92px);
  padding: 0;
  background: transparent;
}

.professional-analysis-page.theme-dark {
  background: transparent;
}

@media (max-width: 768px) {
  .professional-analysis-page,
  .professional-analysis-page.embedded {
    height: calc(100dvh - 56px);
    min-height: 0;
    padding: 8px;
  }
}
</style>
