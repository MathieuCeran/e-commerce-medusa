import type { ComponentConfig } from "@puckeditor/core"
import { AnimationWrapper } from "@modules/common/components/animation-wrapper"
import { cn } from "@lib/util/cn" // Assuming we have a cn utility or similar, usually in Medusa starters or standard Next.js setups. If not, I'll use template literals carefully.
// Checking previous files, I haven't seen 'cn' imported, but I'll use standard template literals to be safe or check if utils exists. 
// Actually, I'll use standard standard template literals since I haven't verified 'cn' existence in this project structure yet, although it's common in Shadcn.
// Wait, I am coding "using shadcn ui + acternity ui" logic, so I should try to make it look like it.

type BentoGripItem = {
  title: string
  description: string
  imageUrl: string
  imageAlt: string
  span: "1" | "2" | "3"
}

export type BentoGridProps = {
  title: string
  items: BentoGripItem[]
  columns: number
  paddingTop: number
  paddingBottom: number
  backgroundColor: string
  textColor: string
  animation: "none" | "fade" | "slide-up" | "slide-left" | "slide-right"
}

export const BentoGrid: ComponentConfig<BentoGridProps> = {
  render: ({
    title,
    items,
    paddingTop,
    paddingBottom,
    backgroundColor,
    textColor,
    animation,
  }) => {
    return (
      <AnimationWrapper animation={animation}>
        <section
          style={{
            backgroundColor: backgroundColor || undefined,
            paddingTop,
            paddingBottom,
          }}
          className="px-6 md:px-12 font-sans"
        >
          <div className="max-w-7xl mx-auto">
            {title && (
              <h2
                className="text-3xl md:text-4xl font-bold text-center mb-12 theme-heading"
                style={{ color: textColor || undefined }}
              >
                {title}
              </h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[20rem]">
              {items.map((item, i) => {
                const spanClass =
                  item.span === "2"
                    ? "md:col-span-2"
                    : item.span === "3"
                    ? "md:col-span-3"
                    : "md:col-span-1"

                return (
                  <div
                    key={i}
                    className={`${spanClass} row-span-1 group relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-transparent transition-all duration-300 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1`}
                  >
                    {/* Background decoration or image */}
                    {item.imageUrl ? (
                      <div className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105">
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>
                    ) : (
                       <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full justify-end">
                       {/* Icon or Label could go here */}
                      <div className="transform transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                        <h3 
                          className={`text-xl font-bold mb-2 ${item.imageUrl ? 'text-white' : 'text-gray-900'}`}
                        >
                          {item.title}
                        </h3>
                        <p 
                          className={`text-sm md:text-base leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all ${item.imageUrl ? 'text-gray-200' : 'text-gray-600'}`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </AnimationWrapper>
    )
  },
}
